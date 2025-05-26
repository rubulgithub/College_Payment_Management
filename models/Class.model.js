import { DataTypes } from "sequelize";
import sequelize from "../config/DB.js";

const Class = sequelize.define(
  "Class",
  {
    class_name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    yearly_fee: DataTypes.DECIMAL(10, 2),
    monthly_fee: DataTypes.DECIMAL(10, 2),
    admission_fee: DataTypes.DECIMAL(10, 2),
  },
  {
    timestamps: true,
  }
);

export default Class;
