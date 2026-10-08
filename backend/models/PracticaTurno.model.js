/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

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
      allowNull: false,
      references: { model: "turno", key: "id_turno" },
    },
    id_practica: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "practica", key: "id_practica" },
    },
    precio_aplicado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    id_obra_social: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "obra_social", key: "id_obra_social" },
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

export default PracticaTurno;
