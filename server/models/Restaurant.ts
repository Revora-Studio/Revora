import mongoose, { Schema } from "mongoose";

export type RestaurantDocument = {
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

const restaurantSchema = new Schema<RestaurantDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true }
  },
  { timestamps: true }
);

export const RestaurantModel =
  mongoose.models.Restaurant || mongoose.model<RestaurantDocument>("Restaurant", restaurantSchema);
