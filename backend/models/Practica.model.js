import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Definir el modelo de Practica según ECMAScript Modules
export const Practica = sequelize.define(
  "Practica",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo_nomenclador: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre_nomenclador: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre_referencia: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    especialidad: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    precio_referencia: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "practica",
    timestamps: true,
  },
);
