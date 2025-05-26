import express from "express";
import dotenv from "dotenv";
import sequelize from "./config/DB.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

import authRoutes from "./routes/auth.routes.js";
import classRoutes from "./routes/class.routes.js";
import studentRoutes from "./routes/student.routes.js";
import FeePayment from "./routes/feePayment.routes.js";
import FeeScheduleRoutes from "./routes/feeSchedule.routes.js";
import reportRoutes from "./routes/report.routes.js";

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/class", classRoutes);
app.use("/api/v1/student", studentRoutes);
app.use("/api/v1/payment", FeePayment);
app.use("/api/v1/fees", FeeScheduleRoutes);
app.use("/api/v1/report", reportRoutes);

app.get("/", (req, res) => {
  res.send("Student Fee Management API");
});

await sequelize.sync();

export default app;
