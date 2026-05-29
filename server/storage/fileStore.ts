import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import type { Lead, LeadInput, LeadStatus } from "../types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const dataFile = path.join(dataDir, "leads.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]", "utf-8");
  }
}

async function readLeads(): Promise<Lead[]> {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf-8");
  return JSON.parse(raw) as Lead[];
}

async function writeLeads(leads: Lead[]) {
  await ensureStore();
  await fs.writeFile(dataFile, JSON.stringify(leads, null, 2), "utf-8");
}

export async function createFileLead(input: LeadInput): Promise<Lead> {
  const leads = await readLeads();
  const now = new Date().toISOString();
  const lead: Lead = {
    id: crypto.randomUUID(),
    ...input,
    status: "new",
    source: "website",
    createdAt: now,
    updatedAt: now
  };
  leads.unshift(lead);
  await writeLeads(leads);
  return lead;
}

export async function listFileLeads(filters: { status?: string; q?: string }) {
  const leads = await readLeads();
  const q = filters.q?.toLowerCase().trim();

  return leads.filter((lead) => {
    const statusMatch = !filters.status || filters.status === "all" || lead.status === filters.status;
    const queryMatch =
      !q ||
      [lead.name, lead.email, lead.phone, lead.brandName, lead.city, lead.businessType]
        .join(" ")
        .toLowerCase()
        .includes(q);
    return statusMatch && queryMatch;
  });
}

export async function updateFileLead(
  id: string,
  updates: Partial<Pick<Lead, "status" | "notes">>
): Promise<Lead | null> {
  const leads = await readLeads();
  const index = leads.findIndex((lead) => lead.id === id);
  if (index === -1) return null;

  leads[index] = {
    ...leads[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  await writeLeads(leads);
  return leads[index];
}

export async function deleteFileLead(id: string) {
  const leads = await readLeads();
  const next = leads.filter((lead) => lead.id !== id);
  await writeLeads(next);
  return next.length !== leads.length;
}

export async function getFileStats() {
  const leads = await readLeads();
  const byStatus = leads.reduce<Record<LeadStatus, number>>(
    (acc, lead) => {
      acc[lead.status] += 1;
      return acc;
    },
    { new: 0, contacted: 0, qualified: 0, proposal: 0, won: 0, lost: 0 }
  );

  return {
    total: leads.length,
    byStatus,
    newest: leads[0]?.createdAt ?? null
  };
}
