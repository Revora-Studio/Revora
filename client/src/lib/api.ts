import type { ClientUser, Lead, LeadInput, LeadStats, LeadStatus } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("revora_admin_token");
  return requestWithToken<T>(path, token, options);
}

async function requestWithToken<T>(path: string, token: string | null, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data as T;
}

export function createLead(input: LeadInput) {
  return request<{ lead: Lead }>("/api/leads", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function adminLogin(input: { email: string; password: string }) {
  return request<{ token: string; admin: { email: string; role: string } }>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function adminSignup(input: { email: string; password: string; inviteCode: string }) {
  return request<{ token: string; admin: { email: string; role: string } }>("/api/admin/signup", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function clientSignup(input: {
  name: string;
  email: string;
  brandName: string;
  businessType: string;
  password: string;
}) {
  return requestWithToken<{ token: string; client: ClientUser }>("/api/client/signup", null, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function clientLogin(input: { email: string; password: string }) {
  return requestWithToken<{ token: string; client: ClientUser }>("/api/client/login", null, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getClientMe() {
  return requestWithToken<{ client: ClientUser }>("/api/client/me", localStorage.getItem("revora_client_token"));
}

export function updateClientMe(input: Pick<ClientUser, "name" | "email" | "brandName" | "businessType">) {
  return requestWithToken<{ token: string; client: ClientUser }>("/api/client/me", localStorage.getItem("revora_client_token"), {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function getLeads(filters: { status?: string; q?: string }) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.q) params.set("q", filters.q);
  return request<{ leads: Lead[] }>(`/api/leads?${params.toString()}`);
}

export function getLeadStats() {
  return request<LeadStats>("/api/leads/stats");
}

export function updateLead(id: string, input: { status?: LeadStatus; notes?: string }) {
  return request<{ lead: Lead }>(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteLead(id: string) {
  return request<{ deleted: boolean }>(`/api/leads/${id}`, {
    method: "DELETE"
  });
}
