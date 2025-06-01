import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Op, fn, col, literal } from "sequelize";
import FeePayment from "../models/FeePayment.model.js";
import FeeSchedule from "../models/FeeSchedule.model.js";
import Student from "../models/Student.model.js";
import Class from "../models/Class.model.js";

export const getFeeReport = asyncHandler(async (req, res) => {
  const { date, month, year, class_id } = req.query;

  if (!date && !month && !year) {
    throw new ApiError(
      400,
      "Please provide date or month and year or only year."
    );
  }

  const whereClause = {};
  const classWhere = {};

  // Filter by class if provided
  if (class_id) {
    classWhere.id = class_id;
    whereClause.class_id = class_id;
  }

  // Day report
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1); // Next day to include full range

    whereClause.payment_date = {
      [Op.gte]: startDate,
      [Op.lt]: endDate,
    };
  }

  // Month + Year report
  else if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1); // Next month

    whereClause.payment_date = {
      [Op.gte]: startDate,
      [Op.lt]: endDate,
    };
  }

  // Only Year report
  else if (year) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(parseInt(year) + 1, 0, 1);

    whereClause.payment_date = {
      [Op.gte]: startDate,
      [Op.lt]: endDate,
    };
  }

  // Group by class
  const payments = await FeePayment.findAll({
    where: whereClause,
    attributes: [
      "class_id",
      [fn("SUM", col("amount_paid")), "total_collected"],
    ],
    group: ["class_id"],
    include: [
      {
        model: Class,
        attributes: ["id", "class_name"],
        where: classWhere,
        required: false,
      },
    ],
  });

  const totalAmount = payments.reduce((sum, record) => {
    return sum + parseFloat(record.get("total_collected") || 0);
  }, 0);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        total_collected: totalAmount.toFixed(2),
        breakdown: payments.map((p) => ({
          class_id: p.class_id,
          class_name: p.Class?.class_name || "Unknown",
          amount: parseFloat(p.get("total_collected") || 0).toFixed(2),
        })),
      },
      "Fee report generated"
    )
  );
});

//Remaining payments to be collected

export const getRemainingFeeReport = asyncHandler(async (req, res) => {
  const { class_id } = req.query;

  const startDate = new Date(new Date().getFullYear(), 0, 1); // Jan 1 of current year
  const endDate = new Date(); // Now

  // Get all classes or specific one
  const classWhere = class_id ? { id: class_id } : {};

  const classes = await Class.findAll({
    where: classWhere,
    attributes: ["id", "class_name", "fee_amount"],
  });

  const report = [];

  for (const cls of classes) {
    const studentCount = await Student.count({
      where: { class_id: cls.id },
    });

    const totalExpected = studentCount * parseFloat(cls.fee_amount || 0);

    const paidResult = await FeePayment.findOne({
      where: {
        class_id: cls.id,
        payment_date: {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        },
      },
      attributes: [[fn("SUM", col("amount_paid")), "total_paid"]],
      raw: true,
    });

    const totalPaid = parseFloat(paidResult.total_paid || 0);
    const remaining = totalExpected - totalPaid;

    report.push({
      class_id: cls.id,
      class_name: cls.class_name,
      student_count: studentCount,
      total_expected: totalExpected.toFixed(2),
      total_paid: totalPaid.toFixed(2),
      remaining_amount: remaining.toFixed(2),
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        year: startDate.getFullYear(),
        report,
      },
      "Remaining fee report generated"
    )
  );
});

/**
 * @description Get fee summary for dashboard (today, this month, this year)
 * @route GET /api/reports/fee-summary
 * @access Private
 */
const getFeeSummary = asyncHandler(async (req, res) => {
  const now = new Date();

  // Today's date range
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Current month date range
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Current year date range
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);

  // Execute all queries in parallel
  // Execute all queries in parallel with proper error handling
  const [todayResult, monthResult, yearResult] = await Promise.all([
    FeePayment.findAll({
      attributes: [[fn("SUM", col("amount_paid")), "total"]],
      where: {
        payment_date: {
          [Op.gte]: todayStart,
          [Op.lt]: todayEnd,
        },
      },
      raw: true,
    }),
    FeePayment.findAll({
      attributes: [[fn("SUM", col("amount_paid")), "total"]],
      where: {
        payment_date: {
          [Op.gte]: monthStart,
          [Op.lt]: monthEnd,
        },
      },
      raw: true,
    }),
    FeePayment.findAll({
      attributes: [[fn("SUM", col("amount_paid")), "total"]],
      where: {
        payment_date: {
          [Op.gte]: yearStart,
          [Op.lt]: yearEnd,
        },
      },
      raw: true,
    }),
  ]);

  // Extract the sum values from the results
  const response = {
    today: parseFloat(todayResult[0]?.total) || 0,
    this_month: parseFloat(monthResult[0]?.total) || 0,
    this_year: parseFloat(yearResult[0]?.total) || 0,
    currency: "PKR",
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Fee summary retrieved successfully"));
});

export { getFeeSummary };

/********************************************************************************** */

export const getPendingPaymentsReport = asyncHandler(async (req, res) => {
  const { class_id } = req.query;
  const currentYear = new Date().getFullYear();

  // Get all active students for the class (if class_id provided) or all classes
  const studentWhere = {};
  const classWhere = {};

  if (class_id) {
    studentWhere.ClassId = class_id;
    classWhere.id = class_id;
  }

  // 1. Get expected fees for the year (monthly fees * 12 + admission fees)
  const classes = await Class.findAll({
    where: classWhere,
    attributes: [
      "id",
      "class_name",
      "monthly_fee",
      "admission_fee",
      [literal("(monthly_fee * 12 + admission_fee)"), "yearly_fee_total"],
    ],
    raw: true,
  });

  //Get all students in these classes
  const students = await Student.findAll({
    where: studentWhere,
    attributes: ["id", "student_name", "ClassId", "admission_fee_paid_amount"],
    include: [
      {
        model: Class,
        attributes: ["class_name"],
        required: true,
      },
    ],
    raw: true,
  });

  // 3. Get all payments made this year
  const currentYearStart = new Date(currentYear, 0, 1);
  const currentYearEnd = new Date(currentYear + 1, 0, 1);

  const payments = await FeePayment.findAll({
    where: {
      payment_date: {
        [Op.gte]: currentYearStart,
        [Op.lt]: currentYearEnd,
      },
      ...(class_id && { class_id }),
    },
    attributes: [
      "class_id",
      "StudentId",
      [fn("SUM", col("amount_paid")), "total_paid"],
    ],
    group: ["class_id", "StudentId"],
    raw: true,
  });

  // 4. Get fee schedules to check which months are unpaid
  const feeSchedules = await FeeSchedule.findAll({
    where: {
      year: currentYear,
      ...(class_id && { "$Student.ClassId$": class_id }),
    },
    include: [
      {
        model: Student,
        attributes: [],
        required: true,
      },
    ],
    raw: true,
  });

  // Calculate expected vs collected amounts
  const classReport = classes.map((cls) => {
    const classStudents = students.filter((s) => s.ClassId === cls.id);
    const classPayments = payments.filter((p) => p.class_id === cls.id);
    const classFeeSchedules = feeSchedules.filter((f) =>
      classStudents.some((s) => s.id === f.StudentId)
    );

    // Calculate total expected
    const totalExpected = classStudents.length * cls.yearly_fee_total;

    // Calculate total collected
    const totalCollected = classPayments.reduce(
      (sum, p) => sum + parseFloat(p.total_paid || 0),
      0
    );

    // Calculate pending amount
    const totalPending = totalExpected - totalCollected;

    // Count unpaid months across all students
    const unpaidMonths = classFeeSchedules.filter(
      (f) => f.status !== "paid"
    ).length;

    return {
      class_id: cls.id,
      class_name: cls.class_name,
      total_students: classStudents.length,
      monthly_fee: cls.monthly_fee,
      admission_fee: cls.admission_fee,
      yearly_fee_total: cls.yearly_fee_total,
      total_expected: totalExpected.toFixed(2),
      total_collected: totalCollected.toFixed(2),
      total_pending: totalPending.toFixed(2),
      unpaid_months: unpaidMonths,
      students: classStudents.map((student) => {
        const studentPayments = classPayments.filter(
          (p) => p.StudentId === student.id
        );
        const studentPaid = studentPayments.reduce(
          (sum, p) => sum + parseFloat(p.total_paid || 0),
          0
        );
        const studentPending = (cls.yearly_fee_total - studentPaid).toFixed(2);

        return {
          student_id: student.id,
          student_name: student.student_name,
          paid_amount: studentPaid.toFixed(2),
          pending_amount: studentPending,
        };
      }),
    };
  });

  // Calculate overall totals
  const overallTotals = {
    total_expected: classReport
      .reduce((sum, cls) => sum + parseFloat(cls.total_expected || 0), 0)
      .toFixed(2),
    total_collected: classReport
      .reduce((sum, cls) => sum + parseFloat(cls.total_collected || 0), 0)
      .toFixed(2),
    total_pending: classReport
      .reduce((sum, cls) => sum + parseFloat(cls.total_pending || 0), 0)
      .toFixed(2),
    total_unpaid_months: classReport.reduce(
      (sum, cls) => sum + (cls.unpaid_months || 0),
      0
    ),
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        year: currentYear,
        overall: overallTotals,
        classes: classReport,
      },
      "Pending payments report generated successfully"
    )
  );
});

export const getStudentsWithPendingDues = asyncHandler(async (req, res) => {
  const { class_id } = req.query;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  // 1. Get all active students (filter by class if provided)
  const studentWhere = {};
  const classWhere = {};

  if (class_id) {
    studentWhere.ClassId = class_id;
    classWhere.id = class_id;
  }

  const students = await Student.findAll({
    where: studentWhere,
    attributes: [
      "id",
      "student_name",
      "roll_number",
      "ClassId",
      "admission_fee_paid_amount",
    ],
    include: [
      {
        model: Class,
        attributes: ["class_name", "monthly_fee", "admission_fee"],
        where: classWhere,
        required: true,
      },
    ],
    raw: true,
  });

  // 2. Get all payments made by these students this year
  const currentYearStart = new Date(currentYear, 0, 1);
  const currentYearEnd = new Date(currentYear + 1, 0, 1);

  const payments = await FeePayment.findAll({
    where: {
      StudentId: students.map((s) => s.id),
      payment_date: {
        [Op.gte]: currentYearStart,
        [Op.lt]: currentYearEnd,
      },
    },
    attributes: ["StudentId", [fn("SUM", col("amount_paid")), "total_paid"]],
    group: ["StudentId"],
    raw: true,
  });

  // 3. Get fee schedules to check unpaid months
  const feeSchedules = await FeeSchedule.findAll({
    where: {
      StudentId: students.map((s) => s.id),
      year: currentYear,
      status: { [Op.ne]: "paid" }, // Only unpaid/partial
    },
    attributes: [
      "StudentId",
      [fn("COUNT", col("id")), "unpaid_months"],
      [fn("SUM", col("due_amount")), "total_due"],
      [fn("SUM", col("paid_amount")), "total_partial_paid"],
    ],
    group: ["StudentId"],
    raw: true,
  });

  // 4. Calculate expected vs paid amounts for each student
  const studentsWithDues = students.map((student) => {
    const studentPayments = payments.find((p) => p.StudentId === student.id);
    const studentFeeSchedule = feeSchedules.find(
      (f) => f.StudentId === student.id
    );

    const monthlyFee = student["Class.monthly_fee"];
    const admissionFee = student["Class.admission_fee"];

    // Calculate expected amounts
    const expectedMonthly = monthlyFee * currentMonth; // Up to current month
    const expectedTotal = expectedMonthly + admissionFee;

    // Calculate paid amounts
    const totalPaid =
      parseFloat(studentPayments?.total_paid || 0) +
      parseFloat(student.admission_fee_paid_amount || 0);

    const pendingAmount = expectedTotal - totalPaid;

    // Determine payment status
    let paymentStatus = "unpaid";
    if (totalPaid > 0) {
      paymentStatus = pendingAmount > 0 ? "partial" : "paid";
    }

    return {
      student_id: student.id,
      roll_number: student.roll_number,
      student_name: student.student_name,
      class_id: student.ClassId,
      class_name: student["Class.class_name"],
      monthly_fee: monthlyFee,
      admission_fee: admissionFee,
      expected_total: expectedTotal.toFixed(2),
      total_paid: totalPaid.toFixed(2),
      pending_amount: pendingAmount > 0 ? pendingAmount.toFixed(2) : "0.00",
      payment_status: paymentStatus,
      unpaid_months: studentFeeSchedule?.unpaid_months || 0,
      partial_payments: studentFeeSchedule?.total_partial_paid || 0,
    };
  });

  // Filter only students with pending dues
  const pendingStudents = studentsWithDues.filter(
    (student) => student.payment_status !== "paid"
  );

  // Group by payment status
  const statusCounts = {
    unpaid: pendingStudents.filter((s) => s.payment_status === "unpaid").length,
    partial: pendingStudents.filter((s) => s.payment_status === "partial")
      .length,
    total: pendingStudents.length,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        year: currentYear,
        up_to_month: currentMonth,
        total_students: students.length,
        pending_students: statusCounts,
        students: pendingStudents,
      },
      "Students with pending dues retrieved successfully"
    )
  );
});
