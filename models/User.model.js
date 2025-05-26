import { DataTypes } from "sequelize";
import sequelize from "../config/DB.js";

const User = sequelize.define(
  "Admin",
  {
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

export default User;
