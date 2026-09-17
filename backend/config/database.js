import { Sequelize } from 'sequelize';
import 'dotenv/config.js'; // Importar y configurar dotenv

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: false,
    define: {
      timestamps: false // <-- Desactiva createdAt y updatedAt en todos los modelos
    }
  }
);

export default sequelize;