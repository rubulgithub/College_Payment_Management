import { Router } from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
} from "../controllers/class.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

// Secure all routes with admin-only access
router.use(verifyToken);

router.post("/create", createClass);
router.get("/getallclasses", getAllClasses);
router.get("/classbyid/:id", getClassById);
router.put("/update/:id", updateClass);
router.delete("/delete/:id", deleteClass);

export default router;
