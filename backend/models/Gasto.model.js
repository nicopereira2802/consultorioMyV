import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import { CategoriaGasto } from "./CategoriaGasto.model.js";

// Definir el modelo de Gasto según ECMAScript Modules
export const Gasto = sequelize.define(
  "Gasto",
  {
    id_gasto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_categoria_gasto: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: CategoriaGasto,
        key: "id_categoria_gasto",
      },
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    concepto: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fecha_gasto: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    metodo_pago: {
      type: DataTypes.ENUM("Efectivo", "Transferencia", "Tarjeta", "Otro"),
      allowNull: false,
      defaultValue: "Efectivo",
    },
    comprobante: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "gasto",
    timestamps: false,
  },
);

export default Gasto;
