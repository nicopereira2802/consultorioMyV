import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Paciente } from "./Paciente.model.js";
import { ObraSocial } from "./ObraSocial.model.js";

// Definir el modelo de PacienteObraSocial según ECMAScript Modules
export const PacienteObraSocial = sequelize.define(
  "PacienteObraSocial",
  {
    id_paciente: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: Paciente,
        key: "id_paciente",
      },
    },
    id_obra_social: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: ObraSocial,
        key: "id_obra_social",
      },
    },
    nro_afiliado: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "paciente_obra_social",
    timestamps: true,
  },
);
