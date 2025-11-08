import express from "express";
import {
  getDiscountSuggestions,
  approveDiscount,
  rejectDiscount,
} from "../controllers/promotion.controller.js";

const router = express.Router();

// You can add authentication middleware if available later
router.get("/suggestions", getDiscountSuggestions);
router.post("/:id/approve", approveDiscount);
router.post("/:id/reject", rejectDiscount);

export default router;
