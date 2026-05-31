import { Router } from "express";
import { z } from "zod";
import { ensureDatabaseReady, isMongoReady } from "../config/db";
import { requireAdmin } from "../middleware/auth";
import { CaseStudyModel, ServiceModel } from "../models/Content";
import {
  createFileCaseStudy,
  createFileService,
  deleteFileCaseStudy,
  deleteFileService,
  listFileCaseStudies,
  listFileServices,
  updateFileService
} from "../storage/contentStore";
import { uploadImageToCloudinary } from "../utils/cloudinary";

export const contentRouter = Router();

const serviceSchema = z.object({
  title: z.string().min(2).max(90),
  kicker: z.string().min(2).max(80),
  detail: z.string().min(10).max(800),
  iconKey: z.string().min(2).max(40)
});

const caseStudySchema = z.object({
  name: z.string().min(2).max(90),
  type: z.string().min(2).max(90),
  image: z.string().min(10),
  before: z.string().min(10).max(800),
  after: z.string().min(10).max(800),
  stats: z.array(z.string().min(2).max(80)).min(1).max(6)
});

function mapMongo(item: any) {
  return {
    id: String(item._id),
    ...item,
    _id: undefined,
    __v: undefined
  };
}

function uniqueByName<T extends { title?: string; name?: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = (item.title || item.name || "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

contentRouter.get("/services", async (_req, res) => {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const services = await ServiceModel.find().sort({ createdAt: 1 }).lean();
    return res.json({ services: uniqueByName(services.map(mapMongo)) });
  }
  return res.json({ services: uniqueByName(await listFileServices()) });
});

contentRouter.post("/services", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please check the service fields." });
  if (isMongoReady()) {
    const exists = await ServiceModel.findOne({ title: new RegExp(`^${escapeRegExp(parsed.data.title.trim())}$`, "i") });
    if (exists) return res.status(409).json({ message: "A service with this title already exists." });
    const service = await ServiceModel.create(parsed.data);
    return res.status(201).json({ service: mapMongo(service.toObject()) });
  }
  const service = await createFileService(parsed.data);
  if (!service) return res.status(409).json({ message: "A service with this title already exists." });
  return res.status(201).json({ service });
});

contentRouter.patch("/services/:id", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please check the service fields." });
  if (isMongoReady()) {
    const exists = await ServiceModel.findOne({
      title: new RegExp(`^${escapeRegExp(parsed.data.title.trim())}$`, "i"),
      _id: { $ne: req.params.id }
    });
    if (exists) return res.status(409).json({ message: "A service with this title already exists." });
    const service = await ServiceModel.findByIdAndUpdate(req.params.id, parsed.data, { new: true }).lean();
    if (service) return res.json({ service: mapMongo(service) });
  }
  const service = await updateFileService(String(req.params.id), parsed.data);
  if (!service) return res.status(404).json({ message: "Service not found." });
  if (service === "title-taken") return res.status(409).json({ message: "A service with this title already exists." });
  return res.json({ service });
});

contentRouter.delete("/services/:id", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const deleted = await ServiceModel.findByIdAndDelete(req.params.id);
    if (deleted) return res.json({ deleted: true });
  }
  return res.json({ deleted: await deleteFileService(String(req.params.id)) });
});

contentRouter.get("/case-studies", async (_req, res) => {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const caseStudies = await CaseStudyModel.find().sort({ createdAt: 1 }).lean();
    return res.json({ caseStudies: uniqueByName(caseStudies.map(mapMongo)) });
  }
  return res.json({ caseStudies: uniqueByName(await listFileCaseStudies()) });
});

contentRouter.post("/case-studies", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  const parsed = caseStudySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Please check the case study fields." });
  let image: string;
  try {
    image = await uploadImageToCloudinary(parsed.data.image, "revora/case-studies");
  } catch (error) {
    return res.status(502).json({ message: error instanceof Error ? error.message : "Image upload failed." });
  }
  const caseStudyInput = { ...parsed.data, image };
  if (isMongoReady()) {
    const exists = await CaseStudyModel.findOne({ name: new RegExp(`^${escapeRegExp(parsed.data.name.trim())}$`, "i") });
    if (exists) return res.status(409).json({ message: "A case study with this brand name already exists." });
    const caseStudy = await CaseStudyModel.create(caseStudyInput);
    return res.status(201).json({ caseStudy: mapMongo(caseStudy.toObject()) });
  }
  const caseStudy = await createFileCaseStudy(caseStudyInput);
  if (!caseStudy) return res.status(409).json({ message: "A case study with this brand name already exists." });
  return res.status(201).json({ caseStudy });
});

contentRouter.delete("/case-studies/:id", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const deleted = await CaseStudyModel.findByIdAndDelete(req.params.id);
    if (deleted) return res.json({ deleted: true });
  }
  return res.json({ deleted: await deleteFileCaseStudy(String(req.params.id)) });
});
