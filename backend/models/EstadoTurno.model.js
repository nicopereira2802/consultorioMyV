import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Definir el modelo de EstadoTurno según ECMAScript Modules
export const EstadoTurno = sequelize.define(
  "EstadoTurno",
  {
    id_estado: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    estado: {
      type: DataTypes.ENUM("Programado", "Reprogramado", "Cancelado", "Atendido", "Inasistente"),
      allowNull: false,
      defaultValue: "Programado",
    },
  },
  {
    tableName: "estado_turno",
    timestamps: false,
  },
);
