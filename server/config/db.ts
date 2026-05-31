import mongoose from "mongoose";

let mongoReady = false;
let connectPromise: Promise<void> | null = null;

export async function connectDatabase() {
  if (connectPromise) return connectPromise;
  connectPromise = connectDatabaseOnce();
  await connectPromise;
  if (!mongoReady) connectPromise = null;
}

async function connectDatabaseOnce() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.log("MONGO_URI missing. API is using local file storage.");
    return;
  }

  try {
    await Promise.race([
      mongoose.connect(uri, {
        serverSelectionTimeoutMS: 3000
      }),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("MongoDB connection timed out.")), 4000);
      })
    ]);
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

export function hasMongoUri() {
  return Boolean(process.env.MONGO_URI);
}

export async function ensureDatabaseReady() {
  if (!hasMongoUri() || isMongoReady()) return isMongoReady();
  await connectDatabase();
  return isMongoReady();
}
