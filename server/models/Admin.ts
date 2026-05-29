import mongoose, { Schema } from "mongoose";

export type AdminDocument = {
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

const adminSchema = new Schema<AdminDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const AdminModel = mongoose.models.Admin || mongoose.model<AdminDocument>("Admin", adminSchema);
