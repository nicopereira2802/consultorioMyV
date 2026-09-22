import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Paciente } from "./Paciente.model.js";
import { EstadoTurno } from "./EstadoTurno.model.js";
import { Practica } from "./Practica.model.js"; 

export const Turno = sequelize.define(
  "Turno",
  {
    id_turno: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_paciente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Paciente,
        key: "id_paciente",
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
    id_practica_planificada: { 
      type: DataTypes.INTEGER,
      allowNull: true, 
      references: {
        model: Practica,
        key: "id_practica",
      },
    },
    fecha_hora_inicio: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_hora_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    precio_final: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    notas_consulta: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "turnos",
    timestamps: false,
  }
);