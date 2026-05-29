import mongoose from "mongoose";

let mongoReady = false;

export async function connectDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.log("MONGO_URI missing. API is using local file storage.");
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3500
    });
    mongoReady = true;
    console.log("MongoDB connected.");
  } catch (error) {
    mongoReady = false;
    console.log("MongoDB unavailable. API is using local file storage.");
    console.log(error instanceof Error ? error.message : error);
  }
}

export function isMongoReady() {
  return mongoReady && mongoose.connection.readyState === 1;
}
