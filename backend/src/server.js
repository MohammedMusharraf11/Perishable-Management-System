// backend/src/server.js
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
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
import promotionRoutes from "./routes/promotion.routes.js";

// Supabase client
import "./config/supabaseClient.js";

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
// Helmet Security
// ======================================================
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
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: "deny" },
    noSniff: true,
    xssFilter: true,
  })
);

// ======================================================
// CORS Configuration
// ======================================================
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:8080",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

// Smart dev mode: auto-allow localhost during development
const isDev = process.env.NODE_ENV !== "production";

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow non-browser tools
      if (isDev && origin.startsWith("http://localhost")) {
        return callback(null, true);
      }
      if (!allowedOrigins.includes(origin)) {
        console.warn("🚫 Blocked CORS from:", origin);
        return callback(new Error("CORS origin not allowed"), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-role",
      "x-user-id",
      "x-user-name",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  })
);

// ✅ Handle all preflight OPTIONS requests
app.options("*", cors());

// ======================================================
// Express Middleware
// ======================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitize incoming body content to prevent XSS injection
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
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

// Optional: Log incoming headers for debugging (uncomment if needed)
// app.use((req, res, next) => {
//   console.log("🧾 Incoming Headers:", req.headers);
//   next();
// });

// ======================================================
// Routes
// ======================================================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/publicENV", publicEnvRouter);
app.use("/api/alerts", alertRoutes);
app.use("/api/promotions", promotionRoutes);

// ======================================================
// Health Check
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
  console.error("🔥 Global Error:", err.stack || err.message || err);
  res.status(500).json({
    error: "Internal Server Error",
    details: err.message || String(err),
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
  console.log("⏰ Initializing Scheduled Jobs...");
  startExpiryMonitorJob();
  console.log("=".repeat(60));
});

export default app;
