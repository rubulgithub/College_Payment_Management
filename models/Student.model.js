import { DataTypes } from "sequelize";
import sequelize from "../config/DB.js";
import Class from "./Class.model.js";

const Student = sequelize.define(
  "Student",
  {
    student_name: DataTypes.STRING,
    roll_number: DataTypes.INTEGER,
    guardian_name: DataTypes.STRING,
    phone_number: DataTypes.STRING,
    gender: {
      type: DataTypes.ENUM("male", "female"),
      allowNull: false,
    },
    admission_fee_paid_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    batch_year: {
      type: DataTypes.INTEGER,
      defaultValue: new Date().getFullYear(),
    },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["roll_number", "ClassId"] }],
  }
);

Class.hasMany(Student);
Student.belongsTo(Class);

export default Student;
