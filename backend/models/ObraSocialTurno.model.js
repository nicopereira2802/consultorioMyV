/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const ObraSocialTurno = sequelize.define(
  "ObraSocialTurno",
  {
    id_obra_social: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "obra_social",
        key: "id_obra_social",
      },
    },
    id_turno: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "turno",
        key: "id_turno",
      },
    },
    id_practica: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "practica",
        key: "id_practica",
      },
    },
  },
  {
    tableName: "obra_social_turno",
    timestamps: false,
  },
);

export default ObraSocialTurno;
