import { Router } from "express";
import { ensureDatabaseReady, isMongoReady } from "../config/db";
import { requireAdmin } from "../middleware/auth";
import { LeadModel } from "../models/Lead";
import {
  createFileLead,
  deleteFileLead,
  getFileStats,
  listFileLeads,
  updateFileLead
} from "../storage/fileStore";
import { leadSchema, leadUpdateSchema } from "../validation/lead";
import type { LeadStatus } from "../types";

export const leadRouter = Router();

function mapMongoLead(lead: any) {
  return {
    id: String(lead._id),
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    brandName: lead.brandName,
    businessType: lead.businessType,
    city: lead.city,
    monthlyBudget: lead.monthlyBudget,
    services: lead.services,
    goals: lead.goals,
    preferredDate: lead.preferredDate,
    notes: lead.notes,
    status: lead.status,
    source: lead.source,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt
  };
}

const emptyStatusCounts: Record<LeadStatus, number> = {
  new: 0,
  contacted: 0,
  qualified: 0,
  proposal: 0,
  won: 0,
  lost: 0
};

leadRouter.post("/", async (req, res) => {
  await ensureDatabaseReady();
  const parsed = leadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Please check the consultation form.", issues: parsed.error.flatten() });
  }

  if (isMongoReady()) {
    const lead = await LeadModel.create(parsed.data);
    return res.status(201).json({ lead: mapMongoLead(lead) });
  }

  const lead = await createFileLead(parsed.data);
  return res.status(201).json({ lead });
});

leadRouter.get("/", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const q = typeof req.query.q === "string" ? req.query.q : undefined;

  if (isMongoReady()) {
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { email: new RegExp(q, "i") },
        { phone: new RegExp(q, "i") },
        { brandName: new RegExp(q, "i") },
        { city: new RegExp(q, "i") },
        { businessType: new RegExp(q, "i") }
      ];
    }
    const leads = await LeadModel.find(filter).sort({ createdAt: -1 }).lean();
    const fileLeads = await listFileLeads({ status, q });
    const combined = [...leads.map(mapMongoLead), ...fileLeads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.json({ leads: combined });
  }

  const leads = await listFileLeads({ status, q });
  return res.json({ leads });
});

leadRouter.get("/stats", requireAdmin, async (_req, res) => {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const [total, grouped, newest] = await Promise.all([
      LeadModel.countDocuments(),
      LeadModel.aggregate([{ $group: { _id: "$status", total: { $sum: 1 } } }]),
      LeadModel.findOne().sort({ createdAt: -1 }).lean()
    ]);

    const byStatus = { ...emptyStatusCounts };
    grouped.forEach((item) => {
      byStatus[item._id as keyof typeof byStatus] = item.total;
    });
    const fileStats = await getFileStats();
    Object.entries(fileStats.byStatus).forEach(([status, count]) => {
      byStatus[status as LeadStatus] += count;
    });

    const newestDates = [newest?.createdAt, fileStats.newest].filter(Boolean).map((date) => new Date(String(date)));
    const newestDate = newestDates.sort((a, b) => b.getTime() - a.getTime())[0];

    return res.json({
      total: total + fileStats.total,
      byStatus,
      newest: newestDate?.toISOString() ?? null
    });
  }

  return res.json(await getFileStats());
});

leadRouter.patch("/:id", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  const parsed = leadUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid update.", issues: parsed.error.flatten() });
  }

  const id = String(req.params.id);

  if (isMongoReady()) {
    const lead = await LeadModel.findByIdAndUpdate(id, parsed.data, { new: true });
    if (lead) return res.json({ lead: mapMongoLead(lead) });
  }

  const lead = await updateFileLead(id, parsed.data);
  if (!lead) return res.status(404).json({ message: "Lead not found." });
  return res.json({ lead });
});

leadRouter.delete("/:id", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  const id = String(req.params.id);

  if (isMongoReady()) {
    const deleted = await LeadModel.findByIdAndDelete(id);
    if (deleted) return res.json({ deleted: true });
  }

  return res.json({ deleted: await deleteFileLead(id) });
});
