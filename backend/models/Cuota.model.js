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
      validate: {
        isIn: {
          args: [["Efectivo", "Transferencia", "Tarjeta", "Otro"]],
          msg: "El metodo de pago no es un valor permitido dentro del ENUM.",
        },
      },
    },
    estado: {
      type: DataTypes.ENUM("Pendiente", "Pagada", "Parcialmente pagada"),
      allowNull: false,
      defaultValue: "Pendiente",
      validate: {
        isIn: {
          args: [["Pendiente", "Pagada", "Parcialmente pagada"]],
          msg: "El estado no es un valor permitido dentro del ENUM.",
        },
      },
    },
    vencida: {
      type: DataTypes.VIRTUAL,
      get() {
        const hoy = new Date();
        return (
          this.estado !== "Pagada" && new Date(this.fecha_vencimiento) < hoy
        );
      },
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "cuota",
    timestamps: false,
  },
);
