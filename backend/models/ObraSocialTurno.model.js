/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { ObraSocial, Turno, Practica } from "./index.model.js";

export const ObraSocialTurno = sequelize.define(
  "ObraSocialTurno",
  {
    id_obra_social: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: ObraSocial,
        key: "id_obra_social",
      },
    },
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
      allowNull: false,
      references: {
        model: Practica,
        key: "id_practica",
      },
    },
  },
  {
    tableName: "obra_social_turno",
    timestamps: false,
  },
);
