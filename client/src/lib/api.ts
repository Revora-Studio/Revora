import type { CaseStudy, ClientUser, Lead, LeadInput, LeadStats, LeadStatus, Restaurant, ServiceItem } from "@/types";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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
  phone: string;
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

export type ClerkClientProfileInput = {
  clerkUserId: string;
  name: string;
  email: string;
  phone?: string;
  brandName?: string;
  businessType?: string;
  avatarUrl?: string;
};

export function syncClerkClient(input: ClerkClientProfileInput, token: string | null) {
  return requestWithToken<{ client: ClientUser }>("/api/client/clerk/sync", token, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function requestClientPasswordOtp(input: { email: string; phone: string }) {
  return requestWithToken<{ message: string; devOtp?: string }>("/api/client/password/otp", null, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function resetClientPassword(input: { email: string; phone: string; otp: string; password: string }) {
  return requestWithToken<{ token: string; client: ClientUser }>("/api/client/password/reset", null, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function getSocialLoginUrl(
  provider: "google" | "microsoft",
  input?: {
    flow?: "login" | "signup";
    redirectTo?: string;
    name?: string;
    phone?: string;
    brandName?: string;
    businessType?: string;
  }
) {
  return requestWithToken<{ url: string }>(`/api/client/oauth/${provider}`, null, {
    method: "POST",
    body: JSON.stringify(input ?? {})
  });
}

export function getClientMe(token?: string | null) {
  return requestWithToken<{ client: ClientUser }>("/api/client/me", token ?? localStorage.getItem("revora_client_token"));
}

export function updateClientMe(input: Pick<ClientUser, "name" | "email" | "phone" | "brandName" | "businessType" | "avatarUrl">, token?: string | null) {
  return requestWithToken<{ token?: string; client: ClientUser }>("/api/client/me", token ?? localStorage.getItem("revora_client_token"), {
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

export function getRestaurants() {
  return requestWithToken<{ restaurants: Restaurant[] }>("/api/restaurants", null);
}

export function createRestaurant(input: { name: string }) {
  return request<{ restaurant: Restaurant }>("/api/restaurants", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function deleteRestaurant(id: string) {
  return request<{ deleted: boolean }>(`/api/restaurants/${id}`, {
    method: "DELETE"
  });
}

export function getServices() {
  return requestWithToken<{ services: ServiceItem[] }>("/api/content/services", null);
}

export function createService(input: Omit<ServiceItem, "id" | "createdAt" | "updatedAt">) {
  return request<{ service: ServiceItem }>("/api/content/services", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function updateService(id: string, input: Omit<ServiceItem, "id" | "createdAt" | "updatedAt">) {
  return request<{ service: ServiceItem }>(`/api/content/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input)
  });
}

export function deleteService(id: string) {
  return request<{ deleted: boolean }>(`/api/content/services/${id}`, {
    method: "DELETE"
  });
}

export function getCaseStudies() {
  return requestWithToken<{ caseStudies: CaseStudy[] }>("/api/content/case-studies", null);
}

export function createCaseStudy(input: Omit<CaseStudy, "id" | "createdAt" | "updatedAt">) {
  return request<{ caseStudy: CaseStudy }>("/api/content/case-studies", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function deleteCaseStudy(id: string) {
  return request<{ deleted: boolean }>(`/api/content/case-studies/${id}`, {
    method: "DELETE"
  });
}
