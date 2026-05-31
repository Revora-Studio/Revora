import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { requireClient } from "../middleware/clientAuth";
import { createClient, findClientById, publicClient, updateClientProfile, verifyClient } from "../storage/clientStore";
import { uploadImageToCloudinary } from "../utils/cloudinary";

export const clientAuthRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2).max(90),
  email: z.string().email(),
  brandName: z.string().min(2).max(120),
  businessType: z.string().min(2).max(80),
  password: z.string().min(8).max(120)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const profileSchema = z.object({
  name: z.string().min(2).max(90),
  email: z.string().email(),
  brandName: z.string().min(2).max(120),
  businessType: z.string().min(2).max(80),
  avatarUrl: z.string().min(10).or(z.literal("")).optional()
});

function signClient(input: { id: string; email: string }) {
  const secret = process.env.CLIENT_JWT_SECRET || process.env.ADMIN_JWT_SECRET || "dev-revora-secret";
  return jwt.sign({ id: input.id, email: input.email, role: "client" }, secret, { expiresIn: "14d" });
}

clientAuthRouter.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Please check the signup form.", issues: parsed.error.flatten() });
  }

  const client = await createClient(parsed.data);
  if (!client) {
    return res.status(409).json({ message: "A client account already exists for this email." });
  }

  return res.status(201).json({
    token: signClient(client),
    client: publicClient(client)
  });
});

clientAuthRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Enter a valid email and password." });
  }

  const client = await verifyClient(parsed.data.email, parsed.data.password);
  if (!client) {
    return res.status(401).json({ message: "Invalid client credentials." });
  }

  return res.json({
    token: signClient(client),
    client: publicClient(client)
  });
});

clientAuthRouter.get("/me", requireClient, async (_req, res) => {
  const client = await findClientById(res.locals.client.id);
  if (!client) {
    return res.status(404).json({ message: "Client account not found." });
  }

  return res.json({ client: publicClient(client) });
});

clientAuthRouter.patch("/me", requireClient, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Please check your profile details.", issues: parsed.error.flatten() });
  }

  const profile = {
    ...parsed.data,
    avatarUrl: parsed.data.avatarUrl
      ? await uploadImageToCloudinary(parsed.data.avatarUrl, "revora/avatars")
      : ""
  };

  const client = await updateClientProfile(res.locals.client.id, profile);
  if (!client) {
    return res.status(404).json({ message: "Client account not found." });
  }
  if (client === "email-taken") {
    return res.status(409).json({ message: "A client account already exists for this email." });
  }

  return res.json({
    token: signClient(client),
    client: publicClient(client)
  });
});
