import { Sequelize } from "sequelize";
import "dotenv/config.js"; // Importar y configurar dotenv

const isTest = process.env.NODE_ENV === "test";

export const sequelize = isTest
  ? new Sequelize("sqlite::memory:", { logging: false })
  : new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: process.env.DB_DIALECT,
      logging: false,
      define: {
        timestamps: false, // <-- Desactiva createdAt y updatedAt en todos los modelos
      },
    });

export default sequelize;
