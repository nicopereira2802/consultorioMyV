/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Practica, Turno, ObraSocial } from "./index.model.js";

export const PracticaTurno = sequelize.define(
  "PracticaTurno",
  {
    id_practica_turno: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_turno: {
      type: DataTypes.INTEGER,
      references: { model: Turno, key: "id_turno" },
    },
    id_practica: {
      type: DataTypes.INTEGER,
      references: { model: Practica, key: "id_practica" },
    },
    id_obra_social: {
      type: DataTypes.INTEGER,
      references: { model: ObraSocial, key: "id_obra_social" },
      allowNull: true,
    },
  },
  {
    tableName: "practica_turno",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["id_turno", "id_practica", "id_obra_social"],
      },
    ],
  },
);
