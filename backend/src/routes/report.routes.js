import express from 'express';
import { getWasteReport, getSummaryReport, getDashboardKPIs } from '../controllers/report.controller.js';

const router = express.Router();

// [PMS-T-087] GET /api/reports/waste - Generate waste report
router.get('/waste', getWasteReport);

// GET /api/reports/summary - Get summary statistics
router.get('/summary', getSummaryReport);

// [PMS-T-093] GET /api/reports/dashboard - Get dashboard KPIs for managers
router.get('/dashboard', getDashboardKPIs);

export default router;
