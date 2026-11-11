import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Definir el modelo de Categoría de Gasto según ECMAScript Modules
export const CategoriaGasto = sequelize.define(
  "CategoriaGasto",
  {
    id_categoria_gasto: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "categoria_gasto",
    timestamps: false,
  },
);

export default CategoriaGasto;
