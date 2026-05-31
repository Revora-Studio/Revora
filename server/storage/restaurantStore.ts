import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import type { Restaurant } from "../types";

const defaultRestaurants = ["Oro Table", "Maison Crumb", "Koya Bar", "Rasa House", "Cloud & Co.", "Luma Dining"];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, "../data");
const restaurantFile = path.join(dataDir, "restaurants.json");

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(restaurantFile);
  } catch {
    const now = new Date().toISOString();
    const restaurants = defaultRestaurants.map((name) => ({
      id: crypto.randomUUID(),
      name,
      createdAt: now,
      updatedAt: now
    }));
    await fs.writeFile(restaurantFile, JSON.stringify(restaurants, null, 2), "utf-8");
  }
}

async function readRestaurants(): Promise<Restaurant[]> {
  await ensureStore();
  const raw = await fs.readFile(restaurantFile, "utf-8");
  return JSON.parse(raw) as Restaurant[];
}

async function writeRestaurants(restaurants: Restaurant[]) {
  await ensureStore();
  await fs.writeFile(restaurantFile, JSON.stringify(restaurants, null, 2), "utf-8");
}

export async function listFileRestaurants() {
  return readRestaurants();
}

export async function createFileRestaurant(name: string) {
  const restaurants = await readRestaurants();
  const normalizedName = name.trim();
  const exists = restaurants.some((restaurant) => restaurant.name.toLowerCase() === normalizedName.toLowerCase());
  if (exists) return null;

  const now = new Date().toISOString();
  const restaurant = {
    id: crypto.randomUUID(),
    name: normalizedName,
    createdAt: now,
    updatedAt: now
  };

  restaurants.push(restaurant);
  await writeRestaurants(restaurants);
  return restaurant;
}

export async function deleteFileRestaurant(id: string) {
  const restaurants = await readRestaurants();
  const next = restaurants.filter((restaurant) => restaurant.id !== id);
  await writeRestaurants(next);
  return next.length !== restaurants.length;
}
