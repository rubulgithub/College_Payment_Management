import express from "express";
import {
  getFeeSummary,
  getFeeReport,
  getRemainingFeeReport,
  getPendingPaymentsReport,
  getStudentsWithPendingDues,
} from "../controllers/report.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/fees", getFeeReport);
router.get("/remaining", getRemainingFeeReport);
router.get("/pending-payments", getPendingPaymentsReport);
router.get("/pending-students", getStudentsWithPendingDues);
router.get("/:student_id", getFeeSummary);

export default router;
