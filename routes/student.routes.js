import { Router } from "express";
import {
  createStudent,
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  searchStudent,
} from "../controllers/student.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

// Protect all routes
router.use(verifyToken);

router.post("/create", createStudent);
router.get("/getallstudents", getAllStudents);
router.get("/search", searchStudent);
router.get("/studentbyid/:id", getStudentById);
router.put("/updated/:id", updateStudent);
router.delete("/delete/:id", deleteStudent);

export default router;
