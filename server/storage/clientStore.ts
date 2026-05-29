import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";

export type ClientUser = {
  id: string;
  name: string;
  email: string;
  brandName: string;
  businessType: string;
  passwordHash: string;
  createdAt: string;
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

export async function createClient(input: {
  name: string;
  email: string;
  brandName: string;
  businessType: string;
  password: string;
}) {
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
    passwordHash: await bcrypt.hash(input.password, 10),
    createdAt: now
  };

  clients.unshift(client);
  await writeClients(clients);
  return client;
}

export async function verifyClient(email: string, password: string) {
  const clients = await readClients();
  const client = clients.find((item) => item.email === email.toLowerCase().trim());
  if (!client) return null;
  const valid = await bcrypt.compare(password, client.passwordHash);
  return valid ? client : null;
}

export async function findClientById(id: string) {
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
  }
) {
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
    businessType: input.businessType.trim()
  };

  await writeClients(clients);
  return clients[index];
}
