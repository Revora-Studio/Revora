import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";
import { ensureDatabaseReady, isMongoReady } from "../config/db";
import { ClientModel } from "../models/Client";

export type ClientUser = {
  id: string;
  name: string;
  email: string;
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
    name: client.name,
    email: client.email,
    brandName: client.brandName,
    businessType: client.businessType,
    avatarUrl: client.avatarUrl || "",
    passwordHash: client.passwordHash,
    createdAt: client.createdAt?.toISOString?.() ?? String(client.createdAt),
    updatedAt: client.updatedAt?.toISOString?.() ?? String(client.updatedAt)
  };
}

export async function createClient(input: {
  name: string;
  email: string;
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

export async function updateClientProfile(
  id: string,
  input: {
    name: string;
    email: string;
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
    brandName: input.brandName.trim(),
    businessType: input.businessType.trim(),
    avatarUrl: input.avatarUrl?.trim() ?? ""
  };

  await writeClients(clients);
  return clients[index];
}
