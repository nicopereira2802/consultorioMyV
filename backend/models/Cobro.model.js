/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Turno, Paciente } from "./index.model.js";

export const Cobro = sequelize.define(
  "Cobro",
  {
    id_cobro: {
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
    id_paciente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Paciente,
        key: "id_paciente",
      },
    },
    monto_a_cobrar: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    cant_cuotas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    fecha_emision: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "cobro",
    timestamps: false,
  },
);
