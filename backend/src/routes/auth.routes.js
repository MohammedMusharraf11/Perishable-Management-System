import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Register
router.post("/register", async (req, res) => {
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

    const { data, error } = await supabase
      .from("pms_users")
      .insert([
        {
          name,
          email: staffEmail,
          password, // ⚠ hash in production
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

// Login
router.post("/login", async (req, res) => {
   try {
    const { email, password } = req.body;

    // Check ONLY database (both staff and managers are here)
    const { data: user, error } = await supabase
      .from("pms_users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !user)
      return res.status(401).json({ error: "Invalid credentials." });

    // Check if user is approved (for managers)
    if (user.role === "Manager" && user.approval_status !== "approved")
      return res.status(401).json({
        error: "Your manager account is pending admin approval.",
      });

    // ✅ ADD: Check if user is active
    if (user.is_active === false) {
      return res.status(401).json({
        error: "Your account has been deactivated. Please contact admin.",
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
        is_active: user.is_active
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
});



export default router;
