// server/server.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import { rateLimitLogin } from "./middleware/auth.middleware.js";

// Jobs
import { startExpiryMonitorJob } from "./jobs/expiryMonitor.job.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import inventoryRoutes from "./routes/inventory_routes.js";
import itemRoutes from "./routes/item.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import cronRoutes from "./routes/cron.routes.js";
import reportRoutes from "./routes/report.routes.js";
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

// Security headers with helmet.js (PMS-T-107)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: true,
  })
);

// ======================================================
// ✅ CORS Configuration (Fix for x-user-role header)
// ======================================================
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:8080",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "🚫 The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-role", // 👈 Needed for Manager Dashboard
    ],
  })
);

// ✅ Handle preflight OPTIONS requests
app.options("*", cors());

// ======================================================
// Body Parsing & Sanitization
// ======================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitize request body (prevent XSS)
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === "string") {
        req.body[key] = req.body[key]
          .replace(/<script[^>]*>.*?<\/script>/gi, "")
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+\s*=/gi, "");
      }
    });
  }
  next();
});

// ======================================================
// Routes
// ======================================================

// Auth & Admin
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Functional routes
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
    message: "Server is running smoothly 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// Global Error Handler
// ======================================================
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err.message);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message,
  });
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
