import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

// Definir el modelo de ObraSocial según ECMAScript Modules
export const ObraSocial = sequelize.define(
  "ObraSocial",
  {
    id_obra_social: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    razon_social: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: "obra_social",
    timestamps: false,
    hooks: {
      beforeValidate: (os) => {
        if (!os.razon_social && os.nombre) {
          os.razon_social = os.nombre;
        }
      },
    },
  },
);
