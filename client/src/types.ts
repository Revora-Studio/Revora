export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  brandName: string;
  businessType: string;
  city: string;
  monthlyBudget: string;
  services: string[];
  goals: string;
  preferredDate?: string;
  notes?: string;
  status: LeadStatus;
  source: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadInput = Omit<Lead, "id" | "status" | "source" | "createdAt" | "updatedAt">;

export type LeadStats = {
  total: number;
  newest: string | null;
  byStatus: Record<LeadStatus, number>;
};

export type ClientUser = {
  id: string;
  name: string;
  email: string;
  brandName: string;
  businessType: string;
  createdAt: string;
};
