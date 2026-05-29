import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().min(2).max(90),
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  brandName: z.string().min(2).max(120),
  businessType: z.string().min(2).max(80),
  city: z.string().min(2).max(90),
  monthlyBudget: z.string().min(2).max(80),
  services: z.array(z.string().min(2)).min(1),
  goals: z.string().min(10).max(1600),
  preferredDate: z.string().max(80).optional().or(z.literal("")),
  notes: z.string().max(1600).optional().or(z.literal(""))
});

export const leadUpdateSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).optional(),
  notes: z.string().max(1600).optional()
});
