import mongoose, { Schema } from "mongoose";

const serviceSchema = new Schema(
  {
    title: { type: String, required: true, unique: true, trim: true },
    kicker: { type: String, required: true, trim: true },
    detail: { type: String, required: true, trim: true },
    iconKey: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const caseStudySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    before: { type: String, required: true, trim: true },
    after: { type: String, required: true, trim: true },
    stats: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const ServiceModel = mongoose.models.ServiceItem || mongoose.model("ServiceItem", serviceSchema);
export const CaseStudyModel = mongoose.models.CaseStudy || mongoose.model("CaseStudy", caseStudySchema);
