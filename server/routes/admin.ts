import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { isMongoReady } from "../config/db";
import { requireAdmin } from "../middleware/auth";
import { AdminModel } from "../models/Admin";
import { promises as fs } from "node:fs";
import path from "node:path";

export const adminRouter = Router();

type StoredAdmin = {
  email: string;
  passwordHash: string;
  createdAt: string;
};

const adminFile = path.resolve(process.cwd(), "data", "admins.json");

async function readAdmins(): Promise<StoredAdmin[]> {
  try {
    const raw = await fs.readFile(adminFile, "utf-8");
    return JSON.parse(raw) as StoredAdmin[];
  } catch {
    return [];
  }
}

async function writeAdmins(admins: StoredAdmin[]) {
  await fs.mkdir(path.dirname(adminFile), { recursive: true });
  await fs.writeFile(adminFile, JSON.stringify(admins, null, 2), "utf-8");
}

async function findAdminByEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  if (isMongoReady()) {
    const admin = await AdminModel.findOne({ email: normalizedEmail }).lean();
    if (!admin) return null;
    return {
      email: admin.email,
      passwordHash: admin.passwordHash,
      createdAt: admin.createdAt.toISOString()
    };
  }

  const admins = await readAdmins();
  return admins.find((admin) => admin.email === normalizedEmail) ?? null;
}

async function createAdmin(email: string, passwordHash: string) {
  const normalizedEmail = email.toLowerCase().trim();

  if (isMongoReady()) {
    const created = await AdminModel.create({ email: normalizedEmail, passwordHash });
    return {
      email: created.email,
      passwordHash: created.passwordHash,
      createdAt: created.createdAt.toISOString()
    };
  }

  const admins = await readAdmins();
  const admin = { email: normalizedEmail, passwordHash, createdAt: new Date().toISOString() };
  admins.push(admin);
  await writeAdmins(admins);
  return admin;
}

function signAdmin(email: string) {
  return jwt.sign({ email, role: "admin" }, process.env.ADMIN_JWT_SECRET || "dev-revora-secret", {
    expiresIn: "8h"
  });
}

adminRouter.post("/signup", async (req, res) => {
  const { email, password, inviteCode } = req.body as { email?: string; password?: string; inviteCode?: string };
  const expectedInvite = process.env.ADMIN_INVITE_CODE || "REVORA-ADMIN";

  if (!email || !password || password.length < 8) {
    return res.status(400).json({ message: "Use an email and a password with at least 8 characters." });
  }

  if (inviteCode !== expectedInvite) {
    return res.status(403).json({ message: "Invalid admin invite code." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const exists = await findAdminByEmail(normalizedEmail);
  if (exists) {
    return res.status(409).json({ message: "An admin with this email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await createAdmin(normalizedEmail, passwordHash);

  const token = signAdmin(admin.email);
  return res.status(201).json({ token, admin: { email: admin.email, role: "admin" } });
});

adminRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  const storedAdmin = email ? await findAdminByEmail(email) : null;
  const storedMatch = storedAdmin ? await bcrypt.compare(password || "", storedAdmin.passwordHash) : false;

  if (!storedMatch || !storedAdmin) {
    return res.status(401).json({ message: "Invalid admin credentials." });
  }

  const token = signAdmin(storedAdmin.email);

  return res.json({
    token,
    admin: {
      email: storedAdmin.email,
      role: "admin"
    }
  });
});

adminRouter.get("/me", requireAdmin, (_req, res) => {
  return res.json({ admin: res.locals.admin });
});
