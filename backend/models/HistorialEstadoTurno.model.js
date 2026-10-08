/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const HistorialEstadoTurno = sequelize.define(
  "HistorialEstadoTurno",
  {
    id_historial: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_turno: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "turno",
        key: "id_turno",
      },
    },
    id_estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "estado_turno",
        key: "id_estado",
      },
    },
    fecha_hora_cambio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Automáticamente guarda el momento exacto del cambio
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "historial_estado_turno",
    timestamps: false,
  },
);
