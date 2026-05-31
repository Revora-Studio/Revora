import mongoose, { Schema } from "mongoose";

export type ClientDocument = {
  name: string;
  email: string;
  brandName: string;
  businessType: string;
  avatarUrl?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const clientSchema = new Schema<ClientDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    brandName: { type: String, required: true, trim: true },
    businessType: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: "" },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const ClientModel = mongoose.models.User || mongoose.model<ClientDocument>("User", clientSchema, "users");
