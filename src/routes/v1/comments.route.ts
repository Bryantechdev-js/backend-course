import { Router } from "express";
import { db } from "../../prisma/db.ts";

const router = Router();

router.get("/", async (req, res) => {
  const comments = await db.orm.public.Comment.all();
  if(!comments) return res.status(404).json({
    success: false,
    error: {
      code: "COMMENTS_NOT_FOUND",
      message: "Comments not found"
    }
  })
  res.status(200).json({
    success: true,
    data: comments
  });
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const comment = await db.orm.public.Comment.where({id}).first();
  if(!comment) return res.status(404).json({
    success: false,
    error: {
      code: "COMMENT_NOT_FOUND",
      message: "Comment not found"
    }
  })
  res.status(200).json({
    success: true,
    data: comment
  });
});

router.post("/", async (req, res) => {
  const comments = await db.orm.public.Comment.create({
    ...req.body
  })
  if(!comments) return res.status(404).json({
    success: false,
    error: {  
      code: "COMMENT_CREATE_FAILED",
      message: "Failed to create comment"
    }
  })
  
  res.status(200).json({
    success: true,
  });
});



router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const comment = await db.orm.public.Comment.where({id}).first()
  if(!comment) return res.status(404).json({
    success: false,
    error: {
      code: "COMMENT_NOT_FOUND",
      message: "Comment not found"
    }
  })
  const updatedComment = await db.orm.public.Comment.where({id}).update({
    ...req.body
  })
  res.status(200).json({
    success: true,
  });
});

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const comment = await db.orm.public.Comment.where({id}).first()
  if(!comment) return res.status(404).json({
    success: false,
    error: {
      code: "COMMENT_NOT_FOUND",
      message: "Comment not found"
    }
  })
  await db.orm.public.Comment.where({id}).delete();
   res.status(200).json({
    success: true,
  });
});

export default router;