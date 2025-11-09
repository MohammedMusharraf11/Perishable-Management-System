import express from 'express';
import { getWasteReport, getSummaryReport } from '../controllers/report.controller.js';

const router = express.Router();

// [PMS-T-087] GET /api/reports/waste - Generate waste report
router.get('/waste', getWasteReport);

// GET /api/reports/summary - Get summary statistics
router.get('/summary', getSummaryReport);

export default router;