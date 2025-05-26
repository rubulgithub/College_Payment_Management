import { Router } from "express";
import {
  recordPayment,
  getPaymentsByStudent,
  getAllPayments,
  deletePayment,
} from "../controllers/feePayment.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all routes
router.use(verifyToken);

router.post("/", recordPayment); // Record payment
router.get("/", getAllPayments); // Get all payments with filters
router.get("/student/:studentId", getPaymentsByStudent); // Get all for one student
router.delete("/:id", deletePayment); // Admin-only delete

export default router;
