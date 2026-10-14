import { CookieOptions } from "express";
import jwt from "jsonwebtoken";

function getAccessSecret(): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not configured.");
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET is not configured.");
  return secret;
}

const isProduction = process.env.NODE_ENV === "production";

export const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 15 * 60 * 1000,
};

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/api/v1/users",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export function createAccessToken(userId: number | string,userEmail:string): string {
  return jwt.sign(
    { sub:{ id: String(userId),email:String(userEmail)}, type: "access" },
    getAccessSecret(),
    { expiresIn: "15m" },
  );
}

export function createRefreshToken(userId: number | string): string {
  return jwt.sign(
    { sub: String(userId), type: "refresh" },
    getRefreshSecret(),
    { expiresIn: "7d" },
  );
}
