/** @format */

import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { Cobro } from "./index.model.js";

export const Cuota = sequelize.define(
  "Cuota",
  {
    id_cuota: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_cobro: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Cobro,
        key: "id_cobro",
      },
    },
    nro_cuota: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    monto_cuota: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    monto_cobrado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY, 
      allowNull: false,
    },
    fecha_cobro: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    metodo_pago: {
      type: DataTypes.ENUM("Efectivo", "Transferencia", "Tarjeta", "Otro"),
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM("Pendiente", "Pagada", "Vencida"),
      allowNull: false,
      defaultValue: "Pendiente",
    },
  },
  {
    tableName: "cuota",
    timestamps: false,
  }
);