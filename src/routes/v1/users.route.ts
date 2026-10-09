import { Router } from "express";

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
    const result = req.body;
    const { email, username,password}:{ email: string; username: string; name: string; password: string} = result;

    if (
      typeof email !== "string" ||
      email.trim() === ""
    ) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_EMAIL",
          message: "email is required"
        }
      });

      return;
    }

    const user = await db.orm.public.User.create({
      email: email.trim(),
      username:
        typeof username === "string"
          ? username.trim()
          : null,
      name:
        typeof name === "string"
          ? name?.trim()
          : null , 
          password
    });

    res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("POST /users error:", error);

    res.status(500).json({
      success: false,
      error: {
        code: "USER_CREATE_FAILED",
        message: "Failed to create user"
      }
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

    const { username, name, is_active } = req.body;

    const updatedUser = await db.orm.public.User
      .where({ id })
      .update({
        ...(typeof username === "string" && {
          username: username.trim()
        }),

        ...(typeof name === "string" && {
          name: name.trim()
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

    res.status(204).send();

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