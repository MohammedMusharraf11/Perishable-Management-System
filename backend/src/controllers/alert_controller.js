import { supabase } from "../config/supabaseClient.js";

// -------------------------------------------
// GET /api/alerts
// -------------------------------------------
export const getExpiryAlerts = async (req, res) => {
  try {
    // 🧩 1️⃣ Role check (Manager only)
    const userRole = req.headers["x-user-role"]; // Sent from frontend
    if (!userRole || userRole !== "Manager") {
      return res.status(403).json({ message: "Access denied. Managers only." });
    }

    // 🕒 2️⃣ Fetch all inventory data
    const { data: items, error } = await supabase.from("v_active_inventory").select("*");
    if (error) throw error;

    const now = new Date();

    // 🧮 3️⃣ Categorize based on hours left
    const expired = [];
    const high = [];
    const medium = [];
    const low = [];

    items.forEach(item => {
      const expiry = new Date(item.expiry_date);
      const diffHrs = (expiry - now) / (1000 * 60 * 60);

      if (diffHrs < 0) expired.push(item);
      else if (diffHrs <= 24) high.push(item);
      else if (diffHrs <= 30) medium.push(item);
      else if (diffHrs <= 48) low.push(item);
    });

    const total = expired.length + high.length + medium.length + low.length;

    // 🧠 Sort top critical by earliest expiry
    const topCritical = [...expired, ...high, ...medium, ...low]
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
      .slice(0, 5);

    res.status(200).json({
      counts: { expired: expired.length, high: high.length, medium: medium.length, low: low.length, total },
      topCritical,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("Error fetching alerts:", err.message);
    res.status(500).json({ message: "Error fetching expiry alerts", error: err.message });
  }
};
