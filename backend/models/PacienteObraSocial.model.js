/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Paciente, ObraSocial } from "./index.model.js";

export const PacienteObraSocial = sequelize.define(
  "PacienteObraSocial",
  {
    id_paciente_obra_social: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_obra_social: {
      type: DataTypes.INTEGER,
      references: {
        model: ObraSocial,
        key: "id_obra_social",
      },
    },
    id_paciente: {
      type: DataTypes.INTEGER,
      references: {
        model: Paciente,
        key: "id_paciente",
      },
    },
    nro_afiliado: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "paciente_obra_social",
    timestamps: false,
  },
);
