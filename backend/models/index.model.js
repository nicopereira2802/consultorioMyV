/** @format */

import sequelize from "../config/database.js";

// Importar modelos
import { Paciente } from "./Paciente.model.js";
import { ObraSocial } from "./ObraSocial.model.js";
import { EstadoTurno } from "./EstadoTurno.model.js";
import { Turno } from "./Turno.model.js";
import { Practica } from "./Practica.model.js";
import { PracticaTurno } from "./PracticaTurno.model.js";
import { PacienteObraSocial } from "./PacienteObraSocial.model.js";
import { HistorialEstadoTurno } from "./HistorialEstadoTurno.model.js";
import { Cobro } from "./Cobro.model.js";
import { Cuota } from "./Cuota.model.js";
import { Usuario } from "./Usuario.model.js";
import { ObraSocialTurno } from "./ObraSocialTurno.model.js";

// ==========================================
// DEFINICIÓN DE RELACIONES
// ==========================================
import { Gasto } from "./Gasto.model.js";
import { CategoriaGasto } from "./CategoriaGasto.model.js";

Paciente.hasMany(Turno, { foreignKey: "id_paciente" });
Turno.belongsTo(Paciente, { foreignKey: "id_paciente" });

EstadoTurno.hasMany(Turno, { foreignKey: "id_estado" });
Turno.belongsTo(EstadoTurno, { foreignKey: "id_estado" });

Practica.hasMany(PracticaTurno, { foreignKey: "id_practica" });
PracticaTurno.belongsTo(Practica, { foreignKey: "id_practica" });

Turno.hasMany(PracticaTurno, { foreignKey: "id_turno" });
PracticaTurno.belongsTo(Turno, { foreignKey: "id_turno" });

// Relación Muchos a Muchos: Turno <-> Practica
Turno.belongsToMany(Practica, {
  through: PracticaTurno,
  foreignKey: "id_turno",
  otherKey: "id_practica",
});
Practica.belongsToMany(Turno, {
  through: PracticaTurno,
  foreignKey: "id_practica",
  otherKey: "id_turno",
});

// Relación Muchos a Muchos: Paciente <-> ObraSocial 
Paciente.hasMany(PacienteObraSocial, { foreignKey: "id_paciente" });
PacienteObraSocial.belongsTo(Paciente, { foreignKey: "id_paciente" });

ObraSocial.hasMany(PacienteObraSocial, { foreignKey: "id_obra_social" });
PacienteObraSocial.belongsTo(ObraSocial, { foreignKey: "id_obra_social" });

Paciente.belongsToMany(ObraSocial, {
  through: PacienteObraSocial,
  foreignKey: "id_paciente",
  otherKey: "id_obra_social",
});
ObraSocial.belongsToMany(Paciente, {
  through: PacienteObraSocial,
  foreignKey: "id_obra_social",
  otherKey: "id_paciente",
});

// Relación PracticaTurno <-> ObraSocial
PracticaTurno.belongsTo(ObraSocial, { foreignKey: "id_obra_social" });
ObraSocial.hasMany(PracticaTurno, { foreignKey: "id_obra_social" });

// Scopes de Paciente
Paciente.addScope(
  "defaultScope",
  {
    include: [
      {
        model: ObraSocial,
        through: {
          attributes: ["nro_afiliado"],
          //where: { activo: true },
        },
        required: false,
      },
    ],
  },
  { override: true },
);

Paciente.addScope("conObrasSociales", {
  include: [
    {
      model: ObraSocial,
      through: {
        attributes: ["nro_afiliado"],
        //where: { activo: true },
      },
      required: false,
    },
  ],
});

// Configuración FK Historial
Turno.hasMany(HistorialEstadoTurno, { foreignKey: "id_turno", as: "historial" });
HistorialEstadoTurno.belongsTo(Turno, { foreignKey: "id_turno" });

EstadoTurno.hasMany(HistorialEstadoTurno, { foreignKey: "id_estado" });
HistorialEstadoTurno.belongsTo(EstadoTurno, { foreignKey: "id_estado" });

// Cobros y Cuotas
Turno.hasOne(Cobro, { foreignKey: "id_turno" }); 
Cobro.belongsTo(Turno, { foreignKey: "id_turno" });

Paciente.hasMany(Cobro, { foreignKey: "id_paciente" });
Cobro.belongsTo(Paciente, { foreignKey: "id_paciente" });

Cobro.hasMany(Cuota, { foreignKey: "id_cobro" });
Cuota.belongsTo(Cobro, { foreignKey: "id_cobro" });

// Relaciones ObraSocialTurno (DER Oficial)
ObraSocial.hasMany(ObraSocialTurno, { foreignKey: "id_obra_social" });
ObraSocialTurno.belongsTo(ObraSocial, { foreignKey: "id_obra_social" });

Turno.hasMany(ObraSocialTurno, { foreignKey: "id_turno" });
ObraSocialTurno.belongsTo(Turno, { foreignKey: "id_turno" });

Practica.hasMany(ObraSocialTurno, { foreignKey: "id_practica" });
ObraSocialTurno.belongsTo(Practica, { foreignKey: "id_practica" });
CategoriaGasto.hasMany(Gasto, {
  foreignKey: "id_categoria_gasto",
  as: "Gastos",
});

Gasto.belongsTo(CategoriaGasto, {
  foreignKey: "id_categoria_gasto",
  as: "CategoriaGasto",
});

const sincronizarModelos = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); 
    console.log("Base de datos autenticada y sincronizada de forma segura");
    return true;
  } catch (error) {
    console.error("Error al sincronizar la base de datos:", error);
    return false;
  }
};

export {
  Paciente,
  ObraSocial,
  EstadoTurno,
  Turno,
  Practica,
  PracticaTurno,
  ObraSocialTurno,
  PacienteObraSocial,
  HistorialEstadoTurno,
  Cobro,
  Cuota,
  Usuario,
  Gasto,
  CategoriaGasto,
  sincronizarModelos,
};