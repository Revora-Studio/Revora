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

export type Restaurant = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ServiceItem = {
  id: string;
  title: string;
  kicker: string;
  detail: string;
  iconKey: string;
  createdAt: string;
  updatedAt: string;
};

export type CaseStudy = {
  id: string;
  name: string;
  type: string;
  image: string;
  before: string;
  after: string;
  stats: string[];
  createdAt: string;
  updatedAt: string;
};
