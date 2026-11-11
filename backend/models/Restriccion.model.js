/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Bloqueos de agenda (día completo o franja horaria)
export const Restriccion = sequelize.define(
  "Restriccion",
  {
    id_restriccion: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    motivo: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Bloqueado",
    },
    todo_el_dia: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hora_inicio: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    hora_fin: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    creado_el: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "restriccion_agenda",
    timestamps: false,
  },
);