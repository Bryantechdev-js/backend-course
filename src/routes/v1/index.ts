import { Router } from "express";

import usersRouter from "./users.route.js";
import postsRouter from "./posts.route.js";
import commentsRouter from "./comments.route.js";

const router = Router();

router.use("/users", usersRouter);
router.use("/posts", postsRouter);
router.use("/comments", commentsRouter);

export default router;