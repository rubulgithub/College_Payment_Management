import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import FeeSchedule from "../models/FeeSchedule.model.js";
import Student from "../models/Student.model.js";
import { Op } from "sequelize";

// 1. Generate monthly schedules for all students
export const generateMonthlySchedules = asyncHandler(async (req, res) => {
  const { month, year } = req.body;

  if (!month || !year) {
    throw new ApiError(400, "Month and year are required");
  }

  const students = await Student.findAll();

  if (!students.length) {
    throw new ApiError(404, "No students found");
  }

  const feeSchedules = await Promise.all(
    students.map((student) =>
      FeeSchedule.findOrCreate({
        where: {
          student_id: student.id,
          month,
          year,
        },
        defaults: {
          status: "unpaid",
        },
      })
    )
  );

  res
    .status(201)
    .json(new ApiResponse(201, null, "Monthly fee schedules generated"));
});

// 2. Get monthly schedule by student
export const getScheduleByStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.params;

  const schedules = await FeeSchedule.findAll({
    where: { student_id: studentId },
    order: [
      ["year", "DESC"],
      ["month", "DESC"],
    ],
  });

  if (!schedules.length) {
    throw new ApiError(404, "No fee schedules found for this student");
  }

  res.status(200).json(new ApiResponse(200, schedules));
});

// 3. Update schedule status (paid, partial, unpaid)
export const updateScheduleStatus = asyncHandler(async (req, res) => {
  const { scheduleId } = req.params;
  const { status } = req.body;

  if (!["paid", "partial", "unpaid"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const schedule = await FeeSchedule.findByPk(scheduleId);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found");
  }

  schedule.status = status;
  await schedule.save();

  res
    .status(200)
    .json(new ApiResponse(200, schedule, "Schedule updated successfully"));
});
