import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Turno } from "./Turno.model.js";
import { EstadoTurno } from "./EstadoTurno.model.js";

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
        model: Turno,
        key: "id_turno",
      },
    },
    id_estado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: EstadoTurno,
        key: "id_estado",
      },
    },
    fecha_hora_cambio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW, // Automáticamente guarda el momento exacto del cambio
    },
    observaciones: {
      type: DataTypes.STRING,
      allowNull: true, // Por si el odontólogo anota "El paciente llamó para reprogramar"
    },
  },
  {
    tableName: "historial_estado_turno",
    timestamps: false,
  }
);