// server/server.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// Jobs
import { startExpiryMonitorJob } from "./jobs/expiryMonitor.job.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import inventoryRoutes from "./routes/inventory_routes.js";
import itemRoutes from "./routes/item.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import cronRoutes from "./routes/cron.routes.js";
import reportRoutes from "./routes/reports.routes.js";
import publicEnvRouter from "./routes/publicENV.js";
import alertRoutes from "./routes/alert_routes.js";

// ======================================================
// Load Environment Variables
// ======================================================
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

// ======================================================
// Initialize Express App
// ======================================================
const app = express();
const PORT = process.env.PORT || 5000;

// ======================================================
// Initialize Supabase Client (for general use)
// ======================================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ======================================================
// Middleware
// ======================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// Routes
// ======================================================

// Auth & Admin
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Existing route files (already modular)
app.use("/api/inventory", inventoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/publicENV", publicEnvRouter);
app.use("/api/alerts", alertRoutes);

// ======================================================
// Health Check Route
// ======================================================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running smoothly",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// Global Error Handler (Optional but useful)
// ======================================================
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// ======================================================
// Start Server
// ======================================================
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `✅ Supabase URL: ${process.env.SUPABASE_URL ? "Loaded" : "NOT LOADED"}`
  );
  console.log("=".repeat(60));
  console.log("✨ Server ready for requests!");
  console.log("-".repeat(60));

  // Start scheduled jobs
  console.log("⏰ Initializing Scheduled Jobs...");
  startExpiryMonitorJob();
  console.log("=".repeat(60));
});

export default app;
