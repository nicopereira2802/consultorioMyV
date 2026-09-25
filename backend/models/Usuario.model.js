import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const Usuario = sequelize.define(
  "Usuario",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre_usuario: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contraseña: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM("admin", "odontologo"),
      allowNull: false,
    },
  },
  {
    tableName: "usuario",
    timestamps: false,
  },
);
