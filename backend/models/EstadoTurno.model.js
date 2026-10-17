/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Definir el modelo de EstadoTurno según ECMAScript Modules
export const EstadoTurno = sequelize.define(
  "EstadoTurno",
  {
    id_estado: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    estado: {
      type: DataTypes.ENUM(
        "Programado",
        "Cancelado",
        "Atendido",
        "Inasistente",
      ),
      allowNull: false,
      unique: true,
      validate: {
        isIn: {
          args: [["Programado", "Cancelado", "Atendido", "Inasistente"]],
          msg: "El estado no es un valor permitido dentro del ENUM.",
        },
      },
    },
  },
  {
    tableName: "estado_turno",
    timestamps: false,
  },
);
