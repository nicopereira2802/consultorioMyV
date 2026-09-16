import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Definir el modelo de ObraSocial según ECMAScript Modules
export const ObraSocial = sequelize.define(
  "ObraSocial",
  {
    id_obra_social: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "obra_social",
    timestamps: false,
  },
);
