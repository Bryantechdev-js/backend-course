
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import apiRouter from "./routes/index.js";
import { requireAuth } from "./middleware/auth.ts";

const app = express();

// 1. Security headers
app.use(helmet());

// 2. CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. Parse incoming request bodies
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 4. Parse cookies
app.use(cookieParser());

// 5. Request logging middleware
app.use(requireAuth)
// 6. Mount API routes
app.use("/api", apiRouter);

export default app;
