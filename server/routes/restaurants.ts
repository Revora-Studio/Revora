import { Router } from "express";
import { z } from "zod";
import { ensureDatabaseReady, isMongoReady } from "../config/db";
import { requireAdmin } from "../middleware/auth";
import { RestaurantModel } from "../models/Restaurant";
import { createFileRestaurant, deleteFileRestaurant, listFileRestaurants } from "../storage/restaurantStore";

export const restaurantRouter = Router();

const restaurantSchema = z.object({
  name: z.string().min(2).max(80)
});

function mapMongoRestaurant(restaurant: any) {
  return {
    id: String(restaurant._id),
    name: restaurant.name,
    createdAt: restaurant.createdAt,
    updatedAt: restaurant.updatedAt
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

restaurantRouter.get("/", async (_req, res) => {
  await ensureDatabaseReady();
  if (isMongoReady()) {
    const restaurants = await RestaurantModel.find().sort({ createdAt: 1 }).lean();
    return res.json({ restaurants: restaurants.map(mapMongoRestaurant) });
  }

  return res.json({ restaurants: await listFileRestaurants() });
});

restaurantRouter.post("/", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  const parsed = restaurantSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Enter a restaurant name between 2 and 80 characters." });
  }

  const name = parsed.data.name.trim();

  if (isMongoReady()) {
    const exists = await RestaurantModel.findOne({ name: new RegExp(`^${escapeRegExp(name)}$`, "i") });
    if (exists) return res.status(409).json({ message: "This restaurant already exists." });
    const restaurant = await RestaurantModel.create({ name });
    return res.status(201).json({ restaurant: mapMongoRestaurant(restaurant) });
  }

  const restaurant = await createFileRestaurant(name);
  if (!restaurant) return res.status(409).json({ message: "This restaurant already exists." });
  return res.status(201).json({ restaurant });
});

restaurantRouter.delete("/:id", requireAdmin, async (req, res) => {
  await ensureDatabaseReady();
  const id = String(req.params.id);

  if (isMongoReady()) {
    const deleted = await RestaurantModel.findByIdAndDelete(id);
    if (deleted) return res.json({ deleted: true });
  }

  return res.json({ deleted: await deleteFileRestaurant(id) });
});
