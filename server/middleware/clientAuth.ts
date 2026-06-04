import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import jwt from "jsonwebtoken";

export type ClientToken = {
  id: string;
  email: string;
  clerkUserId?: string;
  role: "client";
};

export function requireClient(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (auth.userId) {
    res.locals.client = { id: auth.userId, clerkUserId: auth.userId, email: "", role: "client" };
    return next();
  }

  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Client token required." });
  }

  try {
    const secret = process.env.CLIENT_JWT_SECRET || process.env.ADMIN_JWT_SECRET || "dev-revora-secret";
    const decoded = jwt.verify(token, secret) as ClientToken;
    if (decoded.role !== "client") throw new Error("Invalid role");
    res.locals.client = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired client token." });
  }
}
