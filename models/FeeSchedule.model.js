import { DataTypes } from "sequelize";
import sequelize from "../config/DB.js";
import Student from "./Student.model.js";

const FeeSchedule = sequelize.define(
  "FeeSchedule",
  {
    month: DataTypes.TINYINT,
    year: DataTypes.INTEGER,
    due_amount: DataTypes.DECIMAL(10, 2),
    paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("unpaid", "partial", "paid"),
      defaultValue: "unpaid",
    },
    remarks: DataTypes.TEXT,
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["StudentId", "month", "year"] }],
  }
);

Student.hasMany(FeeSchedule);
FeeSchedule.belongsTo(Student);

export default FeeSchedule;
