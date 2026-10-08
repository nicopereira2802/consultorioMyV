import { Sequelize } from "sequelize";
import "dotenv/config.js"; // Importar y configurar dotenv

const isTest = process.env.NODE_ENV === "test";

// DEV: Al finalizar los test deberiamos sacar esto de test

const DB_NAME = process.env.DB_NAME || "consultorio_myv";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.DB_PASS || "root");
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

export const sequelize = isTest
  ? new Sequelize("sqlite::memory:", { logging: false })
  : new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
      host: DB_HOST,
      port: DB_PORT,
      dialect: "mysql",
      timezone: "-03:00",
      dialectOptions: {
        dateStrings: true,
        typeCast: true,
        timezone: "-03:00",
      },
      logging: false,
      define: {
        timestamps: false, // <-- Desactiva createdAt y updatedAt en todos los modelos
        freezeTableName: true, // Evita pluralizaciones automáticas de tablas
      },
    });

export default sequelize;
