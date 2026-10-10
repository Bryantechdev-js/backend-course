import { Router } from "express";
import argon2 from "argon2";
const router = Router();
import { db } from "../../prisma/db.ts";

/**
 * GET /api/v1/users
 * Get users
 */

router.get("/", async (req, res) => {
  try {
    const users = await db.orm.public.User
      .orderBy((user) => user.id.asc())
      .all();

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
router.post("/", async (req, res) => {
  try {
    const { email, username, password } = req.body ?? {};

    // Validate email
    if (typeof email !== "string" || !email.trim()) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_EMAIL",
          message: "Email is required.",
        },
      });
      return;
    }

    // Validate username
    if (typeof username !== "string" || !username.trim()) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_USERNAME",
          message: "Username is required.",
        },
      });
      return;
    }

    // Validate password
    if (typeof password !== "string" || password.length < 8) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_PASSWORD",
          message: "Password must contain at least 8 characters.",
        },
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    // Hash password before persistence
    const hashedPassword = await argon2.hash(password);

    // Create user using your existing Prisma 8 ORM interface
    const user = await db.orm.public.User.create({
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
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

    const updatedUser = await db.orm.public.User
      .where({ id })
      .update({
        ...(typeof username === "string" && {
          username: username.trim()
        }),

        ...(typeof is_active === "boolean" && {
          is_active
        })
      });

    if (!updatedUser) {
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
      data: updatedUser
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

    const deletedUser = await db.orm.public.User
      .where({ id })
      .delete();

    if (!deletedUser) {
      res.status(404).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found"
        }
      });

      return;
    }

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