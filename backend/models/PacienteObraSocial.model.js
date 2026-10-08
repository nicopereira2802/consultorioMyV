/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const PacienteObraSocial = sequelize.define(
  "PacienteObraSocial",
  {
    id_paciente: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "paciente",
        key: "id_paciente",
      },
    },
    id_obra_social: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: "obra_social",
        key: "id_obra_social",
      },
    },
    nro_afiliado: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "paciente_obra_social",
    timestamps: false,
  },
);
