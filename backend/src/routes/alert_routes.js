import express from "express";
import { getExpiryAlerts } from "../controllers/alert_controller.js";

const router = express.Router();

// PMS-T-055: Implement GET /api/alerts
router.get("/", getExpiryAlerts);

export default router;
