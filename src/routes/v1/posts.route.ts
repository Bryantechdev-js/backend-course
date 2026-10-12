import { Router } from "express";
import { db } from "../../prisma/db.ts";

interface PostUpdates {
  title?: string;
  content?: string | null;
}

function parsePostId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function parsePostUpdates(body: unknown): { updates?: PostUpdates; error?: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { error: "Request body must be an object." };
  }

  const values = body as Record<string, unknown>;
  const updates: PostUpdates = {};

  if (values.title !== undefined) {
    if (typeof values.title !== "string" || !values.title.trim()) {
      return { error: "Title must be a non-empty string." };
    }
    updates.title = values.title.trim();
  }

  if (values.content !== undefined) {
    if (values.content !== null && typeof values.content !== "string") {
      return { error: "Content must be a string or null." };
    }
    updates.content = typeof values.content === "string" ? values.content.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return { error: "Provide a title or content to update." };
  }

  return { updates };
}

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const posts = await db.orm.public.Post
      .orderBy((post) => post.createdAt.desc())
      .include("comments")
      .all();

    res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("GET /posts error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "POST_FETCH_FAILED",
        message: "Failed to fetch posts.",
      },
    });
  }
});

router.get("/:id", async (req, res) => {
  const id = parsePostId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_POST_ID",
        message: "Post ID must be a positive integer.",
      },
    });
  }

  try {
    const post = await db.orm.public.Post
      .where({ id })
      .include("comments")
      .first();

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: "POST_NOT_FOUND",
          message: "Post not found.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("GET /posts/:id error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "POST_FETCH_FAILED",
        message: "Failed to fetch post.",
      },
    });
  }
});

router.post("/", async (req, res) => {
  const { title, content, authorId } = req.body ?? {};
  const numericAuthorId = Number(authorId);

  if (
    typeof title !== "string" ||
    !title.trim() ||
    (content !== undefined && content !== null && typeof content !== "string") ||
    !Number.isSafeInteger(numericAuthorId) ||
    numericAuthorId <= 0
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_POST_DATA",
        message: "A title, string or null content, and positive integer authorId are required.",
      },
    });
  }

  try {
    const post = await db.orm.public.Post.create({
      title: title.trim(),
      content: content?.trim() ?? null,
      authorId: numericAuthorId,
    });

    return res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("POST /posts error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "POST_CREATE_FAILED",
        message: "Failed to create post.",
      },
    });
  }
});

router.patch("/", async (req, res) => {
  const { updates, error } = parsePostUpdates(req.body);
  if (error || !updates) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_POST_DATA",
        message: error ?? "Invalid post data.",
      },
    });
  }

  try {
    const updatedPosts = await db.orm.public.Post
      .where((post) => post.id.gt(0))
      .updateAll(updates);

    return res.status(200).json({
      success: true,
      data: updatedPosts,
    });
  } catch (error) {
    console.error("PATCH /posts error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "POST_UPDATE_FAILED",
        message: "Failed to update posts.",
      },
    });
  }
});

router.patch("/:id", async (req, res) => {
  const id = parsePostId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_POST_ID",
        message: "Post ID must be a positive integer.",
      },
    });
  }

  const { updates, error } = parsePostUpdates(req.body);
  if (error || !updates) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_POST_DATA",
        message: error ?? "Invalid post data.",
      },
    });
  }

  try {
    const post = await db.orm.public.Post.where({ id }).update(updates);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          code: "POST_NOT_FOUND",
          message: "Post not found.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("PATCH /posts/:id error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "POST_UPDATE_FAILED",
        message: "Failed to update post.",
      },
    });
  }
});

router.delete("/", async (_req, res) => {
  try {
    const deletedPosts = await db.transaction(async (tx) => {
      const posts = await tx.orm.public.Post
        .where((post) => post.id.gt(0))
        .select("id")
        .all();

      if (posts.length === 0) {
        return 0;
      }

      await tx.orm.public.Comment
        .where((comment) => comment.postId.gt(0))
        .updateAll({ parentId: null });
      await tx.orm.public.Comment
        .where((comment) => comment.postId.gt(0))
        .deleteAll();
      await tx.orm.public.Attachment
        .where((attachment) => attachment.postId.gt(0))
        .deleteAll();
      await tx.orm.public.Post
        .where((post) => post.id.gt(0))
        .deleteAll();

      return posts.length;
    });

    return res.status(200).json({
      success: true,
      data: { deletedPosts },
    });
  } catch (error) {
    console.error("DELETE /posts error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "POST_DELETE_FAILED",
        message: "Failed to delete posts.",
      },
    });
  }
});

router.delete("/:id", async (req, res) => {
  const id = parsePostId(req.params.id);
  if (id === null) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_POST_ID",
        message: "Post ID must be a positive integer.",
      },
    });
  }

  try {
    const deleted = await db.transaction(async (tx) => {
      const post = await tx.orm.public.Post.where({ id }).first();
      if (!post) {
        return false;
      }

      await tx.orm.public.Comment
        .where({ postId: id })
        .updateAll({ parentId: null });
      await tx.orm.public.Comment.where({ postId: id }).deleteAll();
      await tx.orm.public.Attachment.where({ postId: id }).deleteAll();
      await tx.orm.public.Post.where({ id }).delete();

      return true;
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: "POST_NOT_FOUND",
          message: "Post not found.",
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Post and its comments deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /posts/:id error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "POST_DELETE_FAILED",
        message: "Failed to delete post.",
      },
    });
  }
});

export default router;
