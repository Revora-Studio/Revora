import mongoose, { Schema } from "mongoose";
import type { LeadStatus } from "../types";

type LeadDocument = {
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
};

const leadSchema = new Schema<LeadDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    brandName: { type: String, required: true, trim: true },
    businessType: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    monthlyBudget: { type: String, required: true, trim: true },
    services: [{ type: String, required: true }],
    goals: { type: String, required: true, trim: true },
    preferredDate: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "proposal", "won", "lost"],
      default: "new"
    },
    source: { type: String, default: "website" }
  },
  { timestamps: true }
);

export const LeadModel = mongoose.models.Lead || mongoose.model<LeadDocument>("Lead", leadSchema);
