import mongoose, { Schema } from "mongoose";

export type ClientDocument = {
  clerkUserId?: string;
  name: string;
  email: string;
  phone?: string;
  brandName?: string;
  businessType?: string;
  avatarUrl?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const clientSchema = new Schema<ClientDocument>(
  {
    clerkUserId: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    brandName: { type: String, default: "", trim: true },
    businessType: { type: String, default: "", trim: true },
    avatarUrl: { type: String, default: "" },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const ClientModel = mongoose.models.User || mongoose.model<ClientDocument>("User", clientSchema, "users");
