import { DataTypes } from "sequelize";
import sequelize from "../config/DB.js";
import Student from "./Student.model.js";
import Class from "./Class.model.js";

const FeePayment = sequelize.define(
  "FeePayment",
  {
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    amount_paid: DataTypes.DECIMAL(10, 2),
    payment_mode: DataTypes.STRING,
    purpose: {
      type: DataTypes.ENUM("monthly", "admission"),
      defaultValue: "monthly",
    },
    remarks: DataTypes.TEXT,

    class_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Classes",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["payment_date"] }],
  }
);

Student.hasMany(FeePayment);
FeePayment.belongsTo(Student);

Class.hasMany(FeePayment, { foreignKey: "class_id" });
FeePayment.belongsTo(Class, { foreignKey: "class_id" });

export default FeePayment;
