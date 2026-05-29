import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { connectDatabase } from "./config/db";
import { adminRouter } from "./routes/admin";
import { clientAuthRouter } from "./routes/clientAuth";
import { leadRouter } from "./routes/leads";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

loadEnv({ path: path.join(__dirname, ".env") });

const app = express();
const port = Number(process.env.PORT || 5000);
const clientUrl = process.env.CLIENT_URL || "http://127.0.0.1:3000";

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "revora-mern-api" });
});

app.use("/api/admin", adminRouter);
app.use("/api/client", clientAuthRouter);
app.use("/api/leads", leadRouter);

const distPath = path.resolve(__dirname, "../client/dist");
app.use(express.static(distPath));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Revora API running on http://127.0.0.1:${port}`);
});

void connectDatabase();
