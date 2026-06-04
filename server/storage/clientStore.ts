import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { ensureDatabaseReady, isMongoReady } from "../config/db";
import { ClientModel } from "../models/Client";

export type ClientUser = {
  id: string;
  clerkUserId?: string;
  name: string;
  email: string;
  phone: string;
  brandName: string;
  businessType: string;
  avatarUrl?: string;
  passwordHash: string;
  createdAt: string;
  updatedAt?: string;
};

export type PublicClientUser = Omit<ClientUser, "passwordHash">;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const clientFile = path.join(dataDir, "clients.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(clientFile);
  } catch {
    await fs.writeFile(clientFile, "[]", "utf-8");
  }
}

async function readClients(): Promise<ClientUser[]> {
  await ensureStore();
  const raw = await fs.readFile(clientFile, "utf-8");
  return JSON.parse(raw) as ClientUser[];
}

async function writeClients(clients: ClientUser[]) {
  await ensureStore();
  await fs.writeFile(clientFile, JSON.stringify(clients, null, 2), "utf-8");
}

export function publicClient(client: ClientUser): PublicClientUser {
  const { passwordHash, ...safeClient } = client;
  return safeClient;
}

function mapMongoClient(client: any): ClientUser {
  return {
    id: String(client._id),
    clerkUserId: client.clerkUserId || "",
    name: client.name,
    email: client.email,
    phone: client.phone || "",
    brandName: client.brandName || "",
    businessType: client.businessType || "",
    avatarUrl: client.avatarUrl || "",
    passwordHash: client.passwordHash,
    createdAt: client.createdAt?.toISOString?.() ?? String(client.createdAt),
    updatedAt: client.updatedAt?.toISOString?.() ?? String(client.updatedAt)
  };
}

export async function createClient(input: {
  name: string;
  email: string;
  phone: string;
  brandName: string;
  businessType: string;
  password: string;
}) {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const email = input.email.toLowerCase().trim();
    const exists = await ClientModel.findOne({ email });
    if (exists) return null;

    const client = await ClientModel.create({
      name: input.name.trim(),
      email,
      phone: input.phone.trim(),
      brandName: input.brandName.trim(),
      businessType: input.businessType.trim(),
      avatarUrl: "",
      passwordHash: await bcrypt.hash(input.password, 10)
    });
    return mapMongoClient(client);
  }

  const clients = await readClients();
  const email = input.email.toLowerCase().trim();
  const exists = clients.some((client) => client.email === email);
  if (exists) return null;

  const now = new Date().toISOString();
  const client: ClientUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    brandName: input.brandName.trim(),
    businessType: input.businessType.trim(),
    avatarUrl: "",
    passwordHash: await bcrypt.hash(input.password, 10),
    createdAt: now
  };

  clients.unshift(client);
  await writeClients(clients);
  return client;
}

export async function createSocialClient(input: {
  name: string;
  email: string;
  avatarUrl?: string;
  phone?: string;
  brandName?: string;
  businessType?: string;
}) {
  await ensureDatabaseReady();
  const email = input.email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);
  const name = input.name.trim() || email.split("@")[0];
  const phone = input.phone?.trim() ?? "";
  const brandName = input.brandName?.trim() ?? "";
  const businessType = input.businessType?.trim() ?? "";
  const avatarUrl = input.avatarUrl?.trim() ?? "";

  if (isMongoReady()) {
    const exists = await ClientModel.findOne({ email });
    if (exists) {
      const client = await ClientModel.findByIdAndUpdate(
        exists._id,
        {
          name: exists.name || name,
          phone: phone || exists.phone || "",
          brandName: brandName || exists.brandName || "",
          businessType: businessType || exists.businessType || "",
          avatarUrl: exists.avatarUrl || avatarUrl
        },
        { new: true }
      );
      return client ? mapMongoClient(client) : mapMongoClient(exists);
    }

    const client = await ClientModel.create({
      name,
      email,
      phone,
      brandName,
      businessType,
      avatarUrl,
      passwordHash
    });
    return mapMongoClient(client);
  }

  const clients = await readClients();
  const existingIndex = clients.findIndex((client) => client.email === email);
  if (existingIndex !== -1) {
    clients[existingIndex] = {
      ...clients[existingIndex],
      name: clients[existingIndex].name || name,
      phone: phone || clients[existingIndex].phone || "",
      brandName: brandName || clients[existingIndex].brandName || "",
      businessType: businessType || clients[existingIndex].businessType || "",
      avatarUrl: clients[existingIndex].avatarUrl || avatarUrl,
      updatedAt: new Date().toISOString()
    };
    await writeClients(clients);
    return clients[existingIndex];
  }

  const now = new Date().toISOString();
  const client: ClientUser = {
    id: crypto.randomUUID(),
    name,
    email,
    phone,
    brandName,
    businessType,
    avatarUrl,
    passwordHash,
    createdAt: now
  };

  clients.unshift(client);
  await writeClients(clients);
  return client;
}

export async function findClientByClerkId(clerkUserId: string) {
  await ensureDatabaseReady();
  const normalizedClerkUserId = clerkUserId.trim();

  if (isMongoReady()) {
    const client = await ClientModel.findOne({ clerkUserId: normalizedClerkUserId });
    return client ? mapMongoClient(client) : null;
  }

  const clients = await readClients();
  return clients.find((client) => client.clerkUserId === normalizedClerkUserId) ?? null;
}

export async function upsertClerkClient(input: {
  clerkUserId: string;
  name: string;
  email: string;
  phone?: string;
  brandName?: string;
  businessType?: string;
  avatarUrl?: string;
}) {
  await ensureDatabaseReady();
  const clerkUserId = input.clerkUserId.trim();
  const email = input.email.toLowerCase().trim();
  const next = {
    clerkUserId,
    name: input.name.trim() || email.split("@")[0] || "Client",
    email,
    phone: input.phone?.trim() ?? "",
    brandName: input.brandName?.trim() ?? "",
    businessType: input.businessType?.trim() ?? "",
    avatarUrl: input.avatarUrl?.trim() ?? ""
  };

  if (isMongoReady()) {
    const existing = await ClientModel.findOne({
      $or: [{ clerkUserId }, { email }]
    });

    if (existing) {
      const client = await ClientModel.findByIdAndUpdate(
        existing._id,
        {
          clerkUserId,
          name: next.name || existing.name,
          email,
          phone: next.phone || existing.phone || "",
          brandName: next.brandName || existing.brandName || "",
          businessType: next.businessType || existing.businessType || "",
          avatarUrl: next.avatarUrl || existing.avatarUrl || ""
        },
        { new: true }
      );
      return client ? mapMongoClient(client) : mapMongoClient(existing);
    }

    const client = await ClientModel.create({
      ...next,
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10)
    });
    return mapMongoClient(client);
  }

  const clients = await readClients();
  const index = clients.findIndex((client) => client.clerkUserId === clerkUserId || client.email === email);
  if (index !== -1) {
    clients[index] = {
      ...clients[index],
      clerkUserId,
      name: next.name || clients[index].name,
      email,
      phone: next.phone || clients[index].phone || "",
      brandName: next.brandName || clients[index].brandName || "",
      businessType: next.businessType || clients[index].businessType || "",
      avatarUrl: next.avatarUrl || clients[index].avatarUrl || "",
      updatedAt: new Date().toISOString()
    };
    await writeClients(clients);
    return clients[index];
  }

  const now = new Date().toISOString();
  const client: ClientUser = {
    id: crypto.randomUUID(),
    ...next,
    passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
    createdAt: now
  };

  clients.unshift(client);
  await writeClients(clients);
  return client;
}

export async function verifyClient(email: string, password: string) {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const client = await ClientModel.findOne({ email: email.toLowerCase().trim() });
    if (!client) return null;
    const valid = await bcrypt.compare(password, client.passwordHash);
    return valid ? mapMongoClient(client) : null;
  }

  const clients = await readClients();
  const client = clients.find((item) => item.email === email.toLowerCase().trim());
  if (!client) return null;
  const valid = await bcrypt.compare(password, client.passwordHash);
  return valid ? client : null;
}

export async function findClientById(id: string) {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const client = await ClientModel.findById(id);
    return client ? mapMongoClient(client) : null;
  }

  const clients = await readClients();
  return clients.find((client) => client.id === id) ?? null;
}

export async function findClientByEmailAndPhone(email: string, phone: string) {
  await ensureDatabaseReady();
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = phone.trim();

  if (isMongoReady()) {
    const client = await ClientModel.findOne({ email: normalizedEmail, phone: normalizedPhone });
    return client ? mapMongoClient(client) : null;
  }

  const clients = await readClients();
  return clients.find((client) => client.email === normalizedEmail && client.phone === normalizedPhone) ?? null;
}

export async function findClientByEmail(email: string) {
  await ensureDatabaseReady();
  const normalizedEmail = email.toLowerCase().trim();

  if (isMongoReady()) {
    const client = await ClientModel.findOne({ email: normalizedEmail });
    return client ? mapMongoClient(client) : null;
  }

  const clients = await readClients();
  return clients.find((client) => client.email === normalizedEmail) ?? null;
}

export async function updateClientPassword(id: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);

  await ensureDatabaseReady();
  if (isMongoReady()) {
    const client = await ClientModel.findByIdAndUpdate(id, { passwordHash }, { new: true });
    return client ? mapMongoClient(client) : null;
  }

  const clients = await readClients();
  const index = clients.findIndex((client) => client.id === id);
  if (index === -1) return null;

  clients[index] = {
    ...clients[index],
    passwordHash,
    updatedAt: new Date().toISOString()
  };

  await writeClients(clients);
  return clients[index];
}

export async function updateClientProfile(
  id: string,
  input: {
    name: string;
    email: string;
    phone: string;
    brandName: string;
    businessType: string;
    avatarUrl?: string;
  }
) {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const email = input.email.toLowerCase().trim();
    const emailTaken = await ClientModel.findOne({ email, _id: { $ne: id } });
    if (emailTaken) return "email-taken" as const;

    const client = await ClientModel.findByIdAndUpdate(
      id,
      {
        name: input.name.trim(),
        email,
        phone: input.phone.trim(),
        brandName: input.brandName.trim(),
        businessType: input.businessType.trim(),
        avatarUrl: input.avatarUrl?.trim() ?? ""
      },
      { new: true }
    );

    return client ? mapMongoClient(client) : null;
  }

  const clients = await readClients();
  const index = clients.findIndex((client) => client.id === id);
  if (index === -1) return null;

  const email = input.email.toLowerCase().trim();
  const emailTaken = clients.some((client) => client.id !== id && client.email === email);
  if (emailTaken) return "email-taken" as const;

  clients[index] = {
    ...clients[index],
    name: input.name.trim(),
    email,
    phone: input.phone.trim(),
    brandName: input.brandName.trim(),
    businessType: input.businessType.trim(),
    avatarUrl: input.avatarUrl?.trim() ?? ""
  };

  await writeClients(clients);
  return clients[index];
}
