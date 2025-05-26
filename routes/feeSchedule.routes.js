import express from "express";
import {
  generateMonthlySchedules,
  getScheduleByStudent,
  updateScheduleStatus,
} from "../controllers/feeSchedule.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Protected routes
router.post("/generate", verifyToken, generateMonthlySchedules); // Admin use
router.get("/student/:studentId", verifyToken, getScheduleByStudent); // View student’s schedule
router.patch("/:scheduleId/status", verifyToken, updateScheduleStatus); // Update schedule status

export default router;
