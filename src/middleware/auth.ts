
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function getAccessSecret(): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;

  if (!secret) {
    throw new Error("ACCESS_TOKEN_SECRET is not configured.");
  }

  return secret;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
 const authorizedMethod = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];
 const publicPath = ["/api/v1/users/login", "/api/v1/users/register", "/api/v1/users/refresh-token"];
 if(authorizedMethod.includes(req.method)){
   next();
 }
 if(publicPath.includes(req.path)){
    next();
 }
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Please log in to access this resource.",
      },
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "A valid access token is required.",
      },
    });
  }

  try {
    const payload = jwt.verify(token, getAccessSecret());

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !/^\d+$/.test(payload.sub) ||
      Number(payload.sub) <= 0
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "The access token is invalid.",
        },
      });
    }

    // Make the authenticated user's ID available to later middleware
    // and route handlers.
    res.locals.userId = Number(payload.sub);

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_OR_EXPIRED_TOKEN",
        message: "Your session is invalid or expired. Please refresh it.",
      },
    });
  }
}
