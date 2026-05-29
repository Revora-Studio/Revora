import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AdminToken = {
  email: string;
  role: "admin";
};

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Admin token required." });
  }

  try {
    const secret = process.env.ADMIN_JWT_SECRET || "dev-revora-secret";
    const decoded = jwt.verify(token, secret) as AdminToken;
    res.locals.admin = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired admin token." });
  }
}
