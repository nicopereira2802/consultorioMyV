import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Turno } from "./Turno.model.js";
import { Practica } from "./Practica.model.js";

// Definir el modelo de PracticaTurno según ECMAScript Modules
export const PracticaTurno = sequelize.define(
  "PracticaTurno",
  {
    id_turno: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Turno,
        key: "id_turno",
      },
    },
    id_practica: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Practica,
        key: "id_practica",
      },
    },
  },
  {
    tableName: "practica_turno",
    timestamps: false,
  },
);
