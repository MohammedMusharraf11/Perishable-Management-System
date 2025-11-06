import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// --- Load .env from project root ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(projectRoot, ".env") });
// --- End .env loading ---

import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// Routes
import inventoryRoutes from "./routes/inventory_routes.js";
import itemRoutes from "./routes/item.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import cronRoutes from "./routes/cron.routes.js";
import publicEnvRouter from "./routes/publicENV.js";
import alertRoutes from "./routes/alert_routes.js"; // ✅ new alerts route

// Jobs
import { startExpiryMonitorJob } from "./jobs/expiryMonitor.job.js";

// Initialize Express app ✅
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------
// API Routes
// ----------------------------
app.use("/api/alerts", alertRoutes); // ✅ Manager-only expiry alerts
app.use("/api/publicENV", publicEnvRouter);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/cron", cronRoutes);

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
// Authentication Routes
// ----------------------------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
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

      if (availableIds.length === 0) {
        return res
          .status(400)
          .json({ error: "All Staff IDs (1–499) are taken." });
      }

      staffId = availableIds[Math.floor(Math.random() * availableIds.length)];
      const padded = String(staffId).padStart(3, "0");
      staffEmail = `pms_${padded}@gmail.com`;
    }

    const { data: existing } = await supabase
      .from("pms_users")
      .select("*")
      .eq("email", staffEmail)
      .single();

    if (existing) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    const { data, error } = await supabase
      .from("pms_users")
      .insert([
        {
          name,
          email: staffEmail,
          password, // ⚠️ In production, hash passwords
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
      user: data,
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

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
      .from("pms_users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    if (user.role === "Manager" && user.approval_status !== "approved") {
      return res.status(401).json({
        error: "Your manager account is pending admin approval.",
      });
    }

    res.json({
      success: true,
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

// ----------------------------
// Admin Routes
// ----------------------------
app.get("/api/admin/pending-managers", async (req, res) => {
  try {
    const { data: pendingManagers, error } = await supabase
      .from("public.pms_users")
      .select("*")
      .eq("role", "Manager")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true });

    if (error)
      return res
        .status(500)
        .json({ error: "Database error: " + error.message });

    res.json({ success: true, pendingManagers: pendingManagers || [] });
  } catch (error) {
    console.error("Pending managers error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/approve-manager", async (req, res) => {
  try {
    const { managerId } = req.body;

    const { data, error } = await supabase
      .from("public.pms_users")
      .update({ approval_status: "approved" })
      .eq("id", managerId)
      .eq("role", "Manager")
      .select()
      .single();

    if (error)
      return res
        .status(500)
        .json({ error: "Database error: " + error.message });

    if (!data) {
      return res.status(404).json({ error: "Manager not found" });
    }

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
// Route List Helper (for startup log)
// ----------------------------
const listRoutes = (app) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods)
        .map((m) => m.toUpperCase())
        .join(", ");
      routes.push({ method: methods, path: middleware.route.path });
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods)
            .map((m) => m.toUpperCase())
            .join(", ");
          const basePath = middleware.regexp.source
            .replace("\\/?", "")
            .replace("(?=\\/|$)", "")
            .replace(/\\\//g, "/")
            .replace("^", "")
            .replace("$", "");
          routes.push({
            method: methods,
            path: basePath + handler.route.path,
          });
        }
      });
    }
  });
  return routes;
};

// ----------------------------
// Start my Server
// ----------------------------
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `✅ Supabase URL: ${process.env.SUPABASE_URL ? "Loaded" : "NOT LOADED"}`
  );
  console.log("=".repeat(60));

  console.log("\n📡 Available API Endpoints:");
  console.log("-".repeat(60));

  const routes = listRoutes(app);
  const categories = {
    Inventory: routes.filter((r) => r.path.includes("/inventory")),
    Items: routes.filter((r) => r.path.includes("/items")),
    Audit: routes.filter((r) => r.path.includes("/audit")),
    Cron: routes.filter((r) => r.path.includes("/cron")),
    Auth: routes.filter((r) => r.path.includes("/auth")),
    Admin: routes.filter((r) => r.path.includes("/admin")),
    Other: routes.filter(
      (r) =>
        !r.path.includes("/inventory") &&
        !r.path.includes("/items") &&
        !r.path.includes("/audit") &&
        !r.path.includes("/cron") &&
        !r.path.includes("/auth") &&
        !r.path.includes("/admin")
    ),
  };

  for (const [name, routesList] of Object.entries(categories)) {
    if (routesList.length > 0) {
      console.log(`\n📂 ${name} Routes:`);
      routesList.forEach((r) =>
        console.log(
          `   ${r.method.padEnd(7)} http://localhost:${PORT}${r.path}`
        )
      );
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("✨ Server ready for requests!");
  console.log("=".repeat(60) + "\n");

  // Start cron jobs
  console.log("⏰ Initializing Scheduled Jobs...");
  console.log("-".repeat(60));
  startExpiryMonitorJob();
  console.log("-".repeat(60) + "\n");
});

export default app;
