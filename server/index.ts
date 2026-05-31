import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { connectDatabase } from "./config/db";
import { adminRouter } from "./routes/admin";
import { clientAuthRouter } from "./routes/clientAuth";
import { contentRouter } from "./routes/content";
import { leadRouter } from "./routes/leads";
import { restaurantRouter } from "./routes/restaurants";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadEnv({ path: path.join(__dirname, ".env") });

const app = express();
const port = Number(process.env.PORT || 5000);
const defaultClientUrls = "http://127.0.0.1:3000,http://localhost:3000,http://127.0.0.1:3001,http://localhost:3001";
const clientUrls = (process.env.TRUSTED_ORIGIN || process.env.CLIENT_URLS || process.env.CLIENT_URL || defaultClientUrls)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "revora-mern-api" });
});

app.use("/api/admin", adminRouter);
app.use("/api/client", clientAuthRouter);
app.use("/api/content", contentRouter);
app.use("/api/leads", leadRouter);
app.use("/api/restaurants", restaurantRouter);

app.use("/api/{*splat}", (_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ message: error.message || "Server error." });
});

const distPath = path.resolve(__dirname, "../client/dist");
const indexPath = path.join(distPath, "index.html");

if (fs.existsSync(indexPath)) {
  app.use(express.static(distPath));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(indexPath);
  });
} else {
  app.get("/{*splat}", (_req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Revora API is running ."
    });
  });
}

app.listen(port, () => {
  console.log(`Revora API running on http://127.0.0.1:${port}`);
});

void connectDatabase();
