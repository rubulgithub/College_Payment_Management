import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import FeePayment from "../models/FeePayment.model.js";
import Student from "../models/Student.model.js";
import Class from "../models/Class.model.js";
import { Op } from "sequelize";

//Record admission or monthly fee
export const recordPayment = asyncHandler(async (req, res) => {
  const { studentId, amount, purpose, payment_date, class_id } = req.body;

  if (!studentId || !amount || !purpose || !class_id) {
    throw new ApiError(400, "studentId, amount, and purpose are required");
  }

  const student = await Student.findByPk(studentId);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const payment = await FeePayment.create({
    StudentId: studentId,
    class_id,
    amount,
    purpose,
    payment_date: payment_date || new Date(),
  });

  res
    .status(201)
    .json(new ApiResponse(201, payment, "Payment recorded successfully"));
});

//Get all payments for a student
export const getPaymentsByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const student = await Student.findByPk(studentId);
  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const payments = await FeePayment.findAll({
    where: { StudentId: studentId },
    order: [["payment_date", "DESC"]],
  });

  res.status(200).json(new ApiResponse(200, payments));
});

//Paginated & filtered list of all payments
export const getAllPayments = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    purpose,
    classId,
    startDate,
    endDate,
  } = req.query;

  const offset = (page - 1) * limit;

  const where = {};

  if (purpose) where.purpose = purpose;
  if (startDate && endDate) {
    where.payment_date = {
      [Op.between]: [new Date(startDate), new Date(endDate)],
    };
  }

  if (classId) {
    const students = await Student.findAll({ where: { ClassId: classId } });
    const studentIds = students.map((s) => s.id);
    where.StudentId = { [Op.in]: studentIds };
  }

  const { rows: payments, count } = await FeePayment.findAndCountAll({
    where,
    include: [
      {
        model: Student,
        include: [Class],
      },
    ],
    order: [["payment_date", "DESC"]],
    offset: parseInt(offset),
    limit: parseInt(limit),
  });

  res.status(200).json(
    new ApiResponse(200, {
      payments,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
    })
  );
});

//Delete a payment (admin only)
export const deletePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const payment = await FeePayment.findByPk(id);
  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  await payment.destroy();

  res
    .status(200)
    .json(new ApiResponse(200, null, "Payment deleted successfully"));
});
