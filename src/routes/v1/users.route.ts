import { Router } from "express";
import argon2 from "argon2";
const router = Router();
import { db } from "../../prisma/db.ts";
import { userSchema } from "../../lib/zodconfig.ts";
import { rateLimit } from "express-rate-limit";
import { accessCookieOptions, createAccessToken, createRefreshToken, refreshCookieOptions } from "../../lib/helpers/authhelpers.ts";

/**
 * GET /api/v1/users
 * Get users
 */

router.get("/", async (req, res) => {
  try {
   const users = await db.orm.public.User
      .orderBy((user) => user.id.asc())
      .all();
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: "USERS_NOT_FOUND",
          message: "No users found."
        }
      });
        }

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error("GET /users error:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "USERS_FETCH_FAILED",
        message: "Failed to fetch users"
      }
    });
  }
});



/**
 * GET /api/v1/users/:id
 * Get one user
 */
router.get("/:id", async (req, res) => {
  try {
    const {id} = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "User ID must be a positive integer"
        }
      });

      return;
    }

    const user = await db.orm.public.User
      .where({ id })
      .first();

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });

      return;
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("GET /users/:id error:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "USER_FETCH_FAILED",
        message: "Failed to fetch user"
      }
    });
  }
});

/**
 * POST /api/v1/users
 * Create a user
 */
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,  // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  }
});
router.post("/",registerLimiter, async (req, res) => {
  try {
    const { email, username, password } = req.body ?? {};
    const result = userSchema.safeParse({ username, email, password });
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_DATA",
          message: result.error.issues.map((err) => err.message).join(", "),
        },
      });
    }

    const {
      username: validatedUsername,
      email: validatedEmail,
      password: validatedPassword,
    } = result.data;
    // Hash password before persistence
    const hashedPassword = await argon2.hash(validatedPassword);
    const existingUser = await db.orm.public.User.where({ email: validatedEmail }).first();
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: "USER_ALREADY_EXISTS",
          message: "The email is already in use.",
        },
      });
        }

    // Create user using your existing Prisma 8 ORM interface
    const user = await db.orm.public.User.create({
      email: validatedEmail,
      username: validatedUsername,
      password: hashedPassword
    });

    // Never return the password or its hash
    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        is_active: user.is_active,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: unknown) {
    console.error("POST /users:", error);

    const dbError = error as { code?: string };

    if (dbError.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          code: "USER_ALREADY_EXISTS",
          message: "The email or another unique field is already in use.",
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: "USER_CREATE_FAILED",
        message: "Unable to create user.",
      },
    });
  }
});


router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_LOGIN_DATA",
          message: "Email and password are required.",
        },
      });
    }

    const user = await db.orm.public.User
      .where({ email: email.trim() })
      .first();

    if (!user || !(await argon2.verify(user.password, password))) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Email or password is incorrect.",
        },
      });
    }


    // Generate both tokens after successful authentication.
    const accessToken = createAccessToken(user.id,user.email);
    const refreshToken = createRefreshToken(user.id);

    // Store both tokens in the browser as HttpOnly cookies.
    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);
  

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          is_active: user.is_active,
        },
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 604800,
      },
    });
  } catch (error) {
    console.error("POST /users/login error:", error);

    return res.status(500).json({
      success: false,
      error: {
        code: "LOGIN_FAILED",
        message: "Unable to log in right now.",
        raw_error: error instanceof Error ? error.message : String(error),
      },
    });
  }
});


/**
 * PATCH /api/v1/users/:id
 * Update a user
 */
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "User ID must be a positive integer"
        }
      });

      return;
    }

    const { username, is_active } = req.body;

    const User = await db.orm.public.User
      .where({ id })
      
    if (!User) {
      res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });

      return;
    }
    await db.orm.public.User.where({ id }).update({
      username,
      is_active
    });

  

    res.status(200).json({
      success: true,
    });

  } catch (error) {
    console.error("PATCH /users/:id error:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "USER_UPDATE_FAILED",
        message: "Failed to update user"
      }
    });
  }
});

/**
 * DELETE /api/v1/users/:id
 * Delete a user
 */
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USER_ID",
          message: "User ID must be a positive integer"
        }
      });

      return;
    }

    const User = await db.orm.public.User
      .where({ id })
      

    if (!User) {
      res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });

      return;
    }
    await db.orm.public.User.where({ id }).delete();

    res.status(204).json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("DELETE /users/:id error:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "USER_DELETE_FAILED",
        message: "Failed to delete user"
      }
    });
  }
});

export default router;