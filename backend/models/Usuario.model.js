/** @format */

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
      unique: true,
    },
    contraseña: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true, // o false si es obligatorio desde el inicio
      unique: true,
      validate: { isEmail: true },
    },
    pin: {
      type: DataTypes.STRING, // Se almacena hasheado con bcrypt
      allowNull: true,
    },
    reset_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rol: {
      type: DataTypes.ENUM("admin", "odontologo"),
      allowNull: false,
      validate: {
        isIn: {
          args: [["admin", "odontologo"]],
          msg: "El rol no es un valor permitido dentro del ENUM.",
        },
      },
    },
  },
  {
    tableName: "usuario",
    timestamps: false,
  },
);
