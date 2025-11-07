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

// Routes
import inventoryRoutes from "./routes/inventory_routes.js";
import itemRoutes from "./routes/item.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import cronRoutes from "./routes/cron.routes.js";
import reportRoutes from "./routes/reports.routes.js";
import publicEnvRouter from "./routes/publicENV.js";
import alertRoutes from "./routes/alert_routes.js"; // ✅ new alerts route

// Jobs
import { startExpiryMonitorJob } from "./jobs/expiryMonitor.job.js";

// --- Load .env from project root ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(projectRoot, ".env") });
// --- End .env loading ---

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ----------------------------
// Middleware
// ----------------------------

// Security headers with helmet.js (PMS-T-107)
app.use(helmet({
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
    preload: true
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

// CORS configuration with whitelist
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:8080',
  'http://localhost:8080',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing with size limits to prevent DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization - prevent XSS
app.use((req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove potential XSS patterns
        req.body[key] = req.body[key]
          .replace(/<script[^>]*>.*?<\/script>/gi, '')
          .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '');
      }
    });
  }
  next();
});

// ----------------------------
// API Routes
// ----------------------------
app.use("/api/alerts", alertRoutes);
app.use("/api/publicENV", publicEnvRouter);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/reports", reportRoutes);

// ----------------------------
// Health Check
// ----------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------
// Auth & Admin Routes
// ----------------------------

// Register Route - PMS-T-105: Secure password hashing
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Input validation
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    
    let staffEmail = email;
    let staffId = null;

    if (role === "Staff") {
      const { data: usedIds } = await supabase
        .from("pms_users")
        .select("staff_id")
        .not("staff_id", "is", null);

      const usedSet = new Set(usedIds?.map((u) => u.staff_id));
      const availableIds = Array.from({ length: 499 }, (_, i) => i + 1).filter(
        (id) => !usedSet.has(id)
      );

      if (availableIds.length === 0)
        return res.status(400).json({ error: "All Staff IDs (1–499) are taken." });

      staffId = availableIds[Math.floor(Math.random() * availableIds.length)];
      const padded = String(staffId).padStart(3, "0");
      staffEmail = `pms_${padded}@gmail.com`;
    }

    const { data: existing } = await supabase
      .from("pms_users")
      .select("*")
      .eq("email", staffEmail)
      .single();

    if (existing)
      return res.status(400).json({ error: "User with this email already exists." });

    // Hash password using bcrypt (PMS-T-105)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { data, error } = await supabase
      .from("pms_users")
      .insert([
        {
          name,
          email: staffEmail,
          password: hashedPassword,
          role,
          staff_id: staffId,
          approval_status: role === "Manager" ? "pending" : "approved",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      user: { id: data.id, email: data.email, name: data.name, role: data.role },
      message:
        role === "Staff"
          ? `Your Staff ID is: ${String(staffId).padStart(3, "0")}. Use ${staffEmail} to login.`
          : "Signup successful! Please wait for admin approval.",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Login Route - PMS-T-105: Secure authentication with JWT and rate limiting
app.post("/api/auth/login", rateLimitLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const { data: user, error } = await supabase
      .from("pms_users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(401).json({ error: "Invalid credentials." });

    // Verify password using bcrypt (PMS-T-105)
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch)
      return res.status(401).json({ error: "Invalid credentials." });

    if (user.role === "Manager" && user.approval_status !== "approved")
      return res.status(401).json({
        error: "Your manager account is pending admin approval.",
      });

    // Generate JWT token (PMS-T-105)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        approvalStatus: user.approval_status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Pending Managers
app.get("/api/admin/pending-managers", async (req, res) => {
  try {
    const { data: pendingManagers, error } = await supabase
      .from("pms_users")
      .select("*")
      .eq("role", "Manager")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true });

    if (error)
      return res.status(500).json({ error: "Database error: " + error.message });

    res.json({ success: true, pendingManagers: pendingManagers || [] });
  } catch (error) {
    console.error("Pending managers error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Approve Manager
app.post("/api/admin/approve-manager", async (req, res) => {
  try {
    const { managerId } = req.body;

    const { data, error } = await supabase
      .from("pms_users")
      .update({ approval_status: "approved" })
      .eq("id", managerId)
      .eq("role", "Manager")
      .select()
      .single();

    if (error)
      return res.status(500).json({ error: "Database error: " + error.message });

    if (!data)
      return res.status(404).json({ error: "Manager not found" });

    res.json({
      success: true,
      message: "Manager approved successfully",
      manager: data,
    });
  } catch (error) {
    console.error("Approve manager error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// Start Server
// ----------------------------
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

  // Start cron jobs
  console.log("⏰ Initializing Scheduled Jobs...");
  startExpiryMonitorJob();
  console.log("=".repeat(60));
});

export default app;
