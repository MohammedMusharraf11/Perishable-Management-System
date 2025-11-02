// backend/routes/publicEnv.js
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

/**
 * This route securely exposes only safe public env variables
 * for your frontend (never expose service role keys!)
 */
router.get("/supabase-env", (req, res) => {
  try {
    res.json({
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    });
  } catch (err) {
    console.error("Error sending public env vars:", err);
    res.status(500).json({ error: "Failed to load Supabase credentials" });
  }
});

export default router;
