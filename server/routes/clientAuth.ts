import { Router } from "express";
import type { Request } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { requireClient } from "../middleware/clientAuth";
import crypto from "node:crypto";
import { createClient, createSocialClient, findClientByClerkId, findClientByEmail, findClientByEmailAndPhone, findClientById, publicClient, updateClientPassword, updateClientProfile, upsertClerkClient, verifyClient } from "../storage/clientStore";
import { uploadImageToCloudinary } from "../utils/cloudinary";

export const clientAuthRouter = Router();

const signupSchema = z.object({
  name: z.string().min(2).max(90),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
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
  phone: z.string().min(7).max(30),
  brandName: z.string().min(2).max(120),
  businessType: z.string().min(2).max(80),
  avatarUrl: z.string().min(10).or(z.literal("")).optional()
});

const clerkSyncSchema = z.object({
  clerkUserId: z.string().min(4),
  name: z.string().min(1).max(90),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  brandName: z.string().max(120).optional(),
  businessType: z.string().max(80).optional(),
  avatarUrl: z.string().optional()
});

const resetRequestSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(30)
});

const resetVerifySchema = resetRequestSchema.extend({
  otp: z.string().regex(/^\d{6}$/),
  password: z.string().min(8).max(120)
});

const socialProviders = ["google", "microsoft"] as const;
type SocialProvider = (typeof socialProviders)[number];
type OauthState = {
  provider: SocialProvider;
  expiresAt: number;
  flow: "login" | "signup";
  redirectTo: string;
  signup?: {
    name?: string;
    phone: string;
    brandName: string;
    businessType: string;
  };
};

const passwordOtpStore = new Map<string, { clientId: string; otpHash: string; expiresAt: number }>();
const oauthStateStore = new Map<string, OauthState>();
const otpTtlMs = 10 * 60 * 1000;

const socialStartSchema = z.object({
  flow: z.enum(["login", "signup"]).default("login"),
  redirectTo: z.string().startsWith("/").default("/"),
  name: z.string().max(90).optional(),
  phone: z.string().min(7).max(30).optional(),
  brandName: z.string().min(2).max(120).optional(),
  businessType: z.string().min(2).max(80).optional()
});

function signClient(input: { id: string; email: string }) {
  const secret = process.env.CLIENT_JWT_SECRET || process.env.ADMIN_JWT_SECRET || "dev-revora-secret";
  return jwt.sign({ id: input.id, email: input.email, role: "client" }, secret, { expiresIn: "14d" });
}

function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function resetKey(email: string, phone: string) {
  return `${email.toLowerCase().trim()}::${phone.trim()}`;
}

function getClientUrl() {
  return (process.env.CLIENT_URL || process.env.TRUSTED_ORIGIN?.split(",")[0] || "http://127.0.0.1:3000").replace(/\/$/, "");
}

function getApiUrl(req: Request) {
  return (process.env.API_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
}

function redirectWithAuthError(res: Parameters<Parameters<typeof clientAuthRouter.get>[1]>[1], message: string) {
  const params = new URLSearchParams({ authError: message });
  return res.redirect(`${getClientUrl()}/login?${params.toString()}`);
}

function getOauthConfig(provider: SocialProvider, req: Request) {
  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      profileUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      redirectUri: `${getApiUrl(req)}/api/client/oauth/google/callback`,
      scope: "openid email profile"
    };
  }

  return {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authorizeUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    profileUrl: "https://graph.microsoft.com/oidc/userinfo",
    redirectUri: `${getApiUrl(req)}/api/client/oauth/microsoft/callback`,
    scope: "openid email profile"
  };
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

clientAuthRouter.post("/password/otp", async (req, res) => {
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Enter the email and phone number on your client account." });
  }

  const client = await findClientByEmailAndPhone(parsed.data.email, parsed.data.phone);
  if (!client) {
    return res.status(404).json({ message: "No client account matches that email and phone number." });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  passwordOtpStore.set(resetKey(parsed.data.email, parsed.data.phone), {
    clientId: client.id,
    otpHash: hashOtp(otp),
    expiresAt: Date.now() + otpTtlMs
  });

  console.log(`Revora password reset OTP for ${client.email}: ${otp}`);

  return res.json({
    message: "OTP sent to the phone number on your client account.",
    ...(process.env.NODE_ENV === "production" ? {} : { devOtp: otp })
  });
});

clientAuthRouter.post("/password/reset", async (req, res) => {
  const parsed = resetVerifySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Enter your OTP and a password with at least 8 characters." });
  }

  const key = resetKey(parsed.data.email, parsed.data.phone);
  const stored = passwordOtpStore.get(key);
  if (!stored || stored.expiresAt < Date.now()) {
    passwordOtpStore.delete(key);
    return res.status(400).json({ message: "OTP expired. Request a new code." });
  }

  if (stored.otpHash !== hashOtp(parsed.data.otp)) {
    return res.status(401).json({ message: "Invalid OTP." });
  }

  const client = await updateClientPassword(stored.clientId, parsed.data.password);
  passwordOtpStore.delete(key);
  if (!client) {
    return res.status(404).json({ message: "Client account not found." });
  }

  return res.json({
    token: signClient(client),
    client: publicClient(client)
  });
});

clientAuthRouter.post("/oauth/:provider", (req, res) => {
  const provider = req.params.provider as SocialProvider;
  if (!socialProviders.includes(provider)) {
    return res.status(404).json({ message: "Social login provider not supported." });
  }

  const config = getOauthConfig(provider, req);
  if (!config.clientId) {
    return res.status(501).json({
      message: `${provider === "google" ? "Google" : "Microsoft"} login needs ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET configured on the server.`
    });
  }

  const parsed = socialStartSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Please check the signup details before continuing." });
  }
  if (parsed.data.flow === "signup" && (!parsed.data.phone || !parsed.data.brandName || !parsed.data.businessType)) {
    return res.status(400).json({ message: "Add phone, brand name, and business type before continuing with Google." });
  }

  const state = crypto.randomUUID();
  oauthStateStore.set(state, {
    provider,
    expiresAt: Date.now() + 10 * 60 * 1000,
    flow: parsed.data.flow,
    redirectTo: parsed.data.redirectTo,
    signup: parsed.data.flow === "signup"
      ? {
          name: parsed.data.name,
          phone: parsed.data.phone || "",
          brandName: parsed.data.brandName || "",
          businessType: parsed.data.businessType || ""
        }
      : undefined
  });
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope,
    state,
    prompt: "select_account"
  });

  return res.json({ url: `${config.authorizeUrl}?${params.toString()}` });
});

clientAuthRouter.get("/oauth/:provider/callback", async (req, res) => {
  const provider = req.params.provider as SocialProvider;
  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const storedState = oauthStateStore.get(state);
  oauthStateStore.delete(state);

  if (!socialProviders.includes(provider)) {
    return redirectWithAuthError(res, "Social login provider not supported.");
  }

  const providerLabel = provider === "google" ? "Google" : "Microsoft";
  if (!code || !storedState || storedState.expiresAt < Date.now() || storedState.provider !== provider) {
    return redirectWithAuthError(res, `${providerLabel} login expired. Please try again.`);
  }

  const config = getOauthConfig(provider, req);
  if (!config.clientId || !config.clientSecret) {
    return redirectWithAuthError(res, `${providerLabel} login is not configured yet.`);
  }

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code"
    })
  });
  const tokenData = (await tokenResponse.json().catch(() => ({}))) as { access_token?: string; error_description?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    return redirectWithAuthError(res, tokenData.error_description || `${providerLabel} login failed.`);
  }

  const profileResponse = await fetch(config.profileUrl, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const profile = (await profileResponse.json().catch(() => ({}))) as {
    email?: string;
    mail?: string;
    preferred_username?: string;
    given_name?: string;
    family_name?: string;
    verified_email?: boolean;
    name?: string;
    picture?: string;
  };
  const profileEmail = profile.email || profile.mail || profile.preferred_username;
  const profileName = profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ");
  if (!profileResponse.ok || !profileEmail || (provider === "google" && profile.verified_email === false)) {
    return redirectWithAuthError(res, `${providerLabel} did not return a verified email.`);
  }

  let client = await findClientByEmail(profileEmail);
  if (storedState.flow === "signup" || !client) {
    client = await createSocialClient({
      email: profileEmail,
      name: storedState.signup?.name || profileName || "",
      avatarUrl: provider === "google" ? profile.picture || "" : "",
      phone: storedState.signup?.phone,
      brandName: storedState.signup?.brandName,
      businessType: storedState.signup?.businessType
    });
  }

  const params = new URLSearchParams({ clientToken: signClient(client), next: storedState.redirectTo || "/" });
  return res.redirect(`${getClientUrl()}/login?${params.toString()}`);
});

clientAuthRouter.get("/me", requireClient, async (_req, res) => {
  const client = res.locals.client.clerkUserId
    ? await findClientByClerkId(res.locals.client.clerkUserId)
    : await findClientById(res.locals.client.id);
  if (!client) {
    return res.status(404).json({ message: "Client account not found." });
  }

  return res.json({ client: publicClient(client) });
});

clientAuthRouter.post("/clerk/sync", requireClient, async (req, res) => {
  const parsed = clerkSyncSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Please check your Clerk profile details.", issues: parsed.error.flatten() });
  }
  if (res.locals.client.clerkUserId && res.locals.client.clerkUserId !== parsed.data.clerkUserId) {
    return res.status(403).json({ message: "Clerk user mismatch." });
  }

  const client = await upsertClerkClient(parsed.data);
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

  const currentClient = res.locals.client.clerkUserId
    ? await findClientByClerkId(res.locals.client.clerkUserId)
    : await findClientById(res.locals.client.id);
  if (!currentClient) {
    return res.status(404).json({ message: "Client account not found." });
  }

  const client = await updateClientProfile(currentClient.id, profile);
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
