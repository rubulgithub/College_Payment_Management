import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Class from "../models/Class.model.js";

// Create a new class
export const createClass = asyncHandler(async (req, res) => {
  const { class_name, yearly_fee, monthly_fee, admission_fee } = req.body;

  if (!class_name) {
    throw new ApiError(400, "Class name is required");
  }

  const newClass = await Class.create({
    class_name,
    yearly_fee,
    monthly_fee,
    admission_fee,
  });

  res
    .status(201)
    .json(new ApiResponse(201, newClass, "Class created successfully"));
});

// Get all classes
export const getAllClasses = asyncHandler(async (req, res) => {
  const classes = await Class.findAll({ order: [["class_name", "ASC"]] });
  res.status(200).json(new ApiResponse(200, classes));
});

// Get a single class by ID
export const getClassById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const foundClass = await Class.findByPk(id);

  if (!foundClass) {
    throw new ApiError(404, "Class not found");
  }

  res.status(200).json(new ApiResponse(200, foundClass));
});

// Update class details
export const updateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { class_name, yearly_fee, monthly_fee, admission_fee } = req.body;

  const foundClass = await Class.findByPk(id);

  if (!foundClass) {
    throw new ApiError(404, "Class not found");
  }

  await foundClass.update({
    class_name: class_name || foundClass.class_name,
    yearly_fee: yearly_fee ?? foundClass.yearly_fee,
    monthly_fee: monthly_fee ?? foundClass.monthly_fee,
    admission_fee: admission_fee ?? foundClass.admission_fee,
  });

  res
    .status(200)
    .json(new ApiResponse(200, foundClass, "Class updated successfully"));
});

// Delete a class
export const deleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const foundClass = await Class.findByPk(id);
  if (!foundClass) {
    throw new ApiError(404, "Class not found");
  }

  await foundClass.destroy();
  res
    .status(200)
    .json(new ApiResponse(200, null, "Class deleted successfully"));
});
