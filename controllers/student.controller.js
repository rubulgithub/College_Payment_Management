import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Student from "../models/Student.model.js";
import Class from "../models/Class.model.js";
import FeePayment from "../models/FeePayment.model.js"; // Assuming you track payments here
import { Op } from "sequelize";

// 1. Enroll a new student
export const createStudent = asyncHandler(async (req, res) => {
  const {
    name,
    roll_number,
    ClassId,
    guardian_name,
    phone,
    address,
    gender,
    admission_date,
  } = req.body;

  if (!name || !roll_number || !ClassId || !gender) {
    throw new ApiError(400, "Missing required student fields");
  }

  const student = await Student.create({
    name,
    roll_number,
    ClassId,
    guardian_name,
    phone,
    address,
    gender,
    admission_date,
  });

  res
    .status(201)
    .json(new ApiResponse(201, student, "Student enrolled successfully"));
});

// 2. List students (filter by class, gender, name)
export const getAllStudents = asyncHandler(async (req, res) => {
  const { classId, gender, name } = req.query;

  const where = {};
  if (classId) where.ClassId = classId;
  if (gender) where.gender = gender;
  if (name) where.name = { [Op.iLike]: `%${name}%` };

  const students = await Student.findAll({
    where,
    include: [{ model: Class }],
    order: [["name", "ASC"]],
  });

  res.status(200).json(new ApiResponse(200, students));
});

// 3. Get student by ID with fee details
export const getStudentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findByPk(id, {
    include: [{ model: Class }, { model: FeePayment }],
  });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  res.status(200).json(new ApiResponse(200, student));
});

// 4. Update student info
export const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, guardian_name, phone, address, gender, ClassId } = req.body;

  const student = await Student.findByPk(id);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  await student.update({
    name: name ?? student.name,
    guardian_name: guardian_name ?? student.guardian_name,
    phone: phone ?? student.phone,
    address: address ?? student.address,
    gender: gender ?? student.gender,
    ClassId: ClassId ?? student.ClassId,
  });

  res
    .status(200)
    .json(new ApiResponse(200, student, "Student updated successfully"));
});

// 5. Delete student
export const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const student = await Student.findByPk(id);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  await student.destroy();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Student removed successfully"));
});

// 6. Search by name or roll_number
export const searchStudent = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    throw new ApiError(400, "Search query is required");
  }

  const students = await Student.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { roll_number: { [Op.iLike]: `%${query}%` } },
      ],
    },
    order: [["name", "ASC"]],
  });

  res.status(200).json(new ApiResponse(200, students));
});
