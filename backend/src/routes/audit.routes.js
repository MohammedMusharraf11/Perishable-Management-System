import express from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';

const router = express.Router();

// GET /api/audit-logs
router.get('/', getAuditLogs);

export default router;
