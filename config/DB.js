import { Sequelize } from "sequelize";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../db/database.sqlite"),
  logging: console.log,
});

try {
  await sequelize.authenticate();
  console.log("Database connected successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

export default sequelize;
