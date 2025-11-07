// routes/admin.routes.js
import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =======================================================
// GET ALL USERS
// =======================================================
router.get("/users", async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("pms_users")
      .select("id, name, email, role, staff_id, approval_status, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error)
      return res.status(500).json({ error: "Failed to fetch users: " + error.message });

    res.json({
      success: true,
      users: users || [],
      total: users?.length || 0,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =======================================================
// GET PENDING MANAGERS
// =======================================================
router.get("/pending-managers", async (req, res) => {
  try {
    const { data: pendingManagers, error } = await supabase
      .from("pms_users")
      .select("*")
      .eq("role", "Manager")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true });

    if (error)
      return res.status(500).json({ error: "Database error: " + error.message });

    res.json({
      success: true,
      pendingManagers: pendingManagers || [],
    });
  } catch (error) {
    console.error("Pending managers error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =======================================================
// CREATE NEW USER (ADMIN PANEL)
// =======================================================
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !password || !role) {
      return res.status(400).json({ error: "Name, password, and role are required" });
    }

    let finalEmail = email;
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
        return res.status(400).json({ error: "All Staff IDs (1–499) are taken." });
      }

      staffId = availableIds[Math.floor(Math.random() * availableIds.length)];
      const padded = String(staffId).padStart(3, "0");
      finalEmail = `pms_${padded}@gmail.com`;
    }

    const { data: existing } = await supabase
      .from("pms_users")
      .select("*")
      .eq("email", finalEmail)
      .single();

    if (existing) {
      return res.status(400).json({ error: "User with this email already exists." });
    }

    const { data, error } = await supabase
      .from("pms_users")
      .insert([
        {
          name,
          email: finalEmail,
          password,
          role,
          staff_id: staffId,
          approval_status: role === "Manager" ? "pending" : "approved",
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Audit log
    await supabase.from("audit_logs").insert([
      {
        user_id: null,
        action: "USER_CREATED",
        entity_type: "users",
        entity_id: data.id,
        old_values: null,
        new_values: {
          name: data.name,
          email: data.email,
          role: data.role,
          staff_id: data.staff_id,
        },
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      },
    ]);

    res.json({
      success: true,
      user: data,
      message:
        role === "Staff"
          ? `Staff user created successfully. Staff ID: ${String(staffId).padStart(3, "0")}`
          : "Manager user created successfully. Requires approval.",
      generatedEmail: finalEmail,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =======================================================
// APPROVE MANAGER
// =======================================================
router.post("/approve-manager", async (req, res) => {
  try {
    const { managerId } = req.body;
    if (!managerId)
      return res.status(400).json({ error: "managerId is required" });

    const { data: managerBefore } = await supabase
      .from("pms_users")
      .select("*")
      .eq("id", managerId)
      .single();

    if (!managerBefore)
      return res.status(404).json({ error: "Manager not found" });

    const { data, error } = await supabase
      .from("pms_users")
      .update({ approval_status: "approved" })
      .eq("id", managerId)
      .eq("role", "Manager")
      .select()
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert([
      {
        user_id: null,
        action: "MANAGER_APPROVED",
        entity_type: "users",
        entity_id: managerId,
        old_values: { approval_status: managerBefore.approval_status },
        new_values: { approval_status: "approved" },
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      },
    ]);

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

// =======================================================
// UPDATE USER STATUS (ACTIVATE / DEACTIVATE)
// =======================================================
router.put("/users/:userId/status", async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ error: "is_active must be a boolean" });
    }

    const { data: userBefore } = await supabase
      .from("pms_users")
      .select("is_active")
      .eq("id", userId)
      .single();

    const { data, error } = await supabase
      .from("pms_users")
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    await supabase.from("audit_logs").insert([
      {
        user_id: null,
        action: is_active ? "USER_ACTIVATED" : "USER_DEACTIVATED",
        entity_type: "users",
        entity_id: userId,
        old_values: { is_active: userBefore.is_active },
        new_values: { is_active: is_active },
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      },
    ]);

    res.json({
      success: true,
      user: data,
      message: `User ${is_active ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =======================================================
// RESET USER PASSWORD
// =======================================================
router.post("/users/:userId/reset-password", async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword)
      return res.status(400).json({ error: "New password is required" });

    const { data } = await supabase
      .from("pms_users")
      .update({
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    await supabase.from("audit_logs").insert([
      {
        user_id: null,
        action: "PASSWORD_RESET",
        entity_type: "users",
        entity_id: userId,
        old_values: null,
        new_values: { password_reset: true },
        ip_address: req.ip,
        user_agent: req.get("User-Agent"),
      },
    ]);

    res.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =======================================================
// GET USER MANAGEMENT AUDIT LOGS
// =======================================================
router.get("/audit-logs/user-management", async (req, res) => {
  try {
    const { data: auditLogs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .in("action", [
        "USER_CREATED",
        "MANAGER_APPROVED",
        "USER_ACTIVATED",
        "USER_DEACTIVATED",
        "PASSWORD_RESET",
        "USER_UPDATED",
      ])
      .order("created_at", { ascending: false })
      .limit(100);

    if (error)
      return res.status(500).json({ error: "Failed to fetch audit logs" });

    res.json({
      success: true,
      auditLogs: auditLogs || [],
      total: auditLogs?.length || 0,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: error.message });
  }
});

// =======================================================
// DEBUG: SHOW LATEST AUDIT LOGS
// =======================================================
router.get("/debug/audit-logs", async (req, res) => {
  try {
    const { data: auditLogs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error)
      return res
        .status(500)
        .json({ error: "Failed to fetch audit logs: " + error.message });

    res.json({
      success: true,
      auditLogs: auditLogs || [],
      total: auditLogs?.length || 0,
    });
  } catch (error) {
    console.error("Debug audit logs error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
