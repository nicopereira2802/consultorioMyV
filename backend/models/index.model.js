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

// Definir relaciones entre modelos
Paciente.hasMany(Turno, { foreignKey: "id_paciente" });
Turno.belongsTo(Paciente, { foreignKey: "id_paciente" });

EstadoTurno.hasMany(Turno, { foreignKey: "id_estado" });
Turno.belongsTo(EstadoTurno, { foreignKey: "id_estado" });

Practica.hasMany(PracticaTurno, { foreignKey: "id_practica" });
PracticaTurno.belongsTo(Practica, { foreignKey: "id_practica" });

Turno.hasMany(PracticaTurno, { foreignKey: "id_turno" });
PracticaTurno.belongsTo(Turno, { foreignKey: "id_turno" });

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

// Relación PracticaTurno <-> ObraSocial (Obra social registrada para las prácticas del turno)
PracticaTurno.belongsTo(ObraSocial, { foreignKey: "id_obra_social" });
ObraSocial.hasMany(PracticaTurno, { foreignKey: "id_obra_social" });

// Scope por defecto para Paciente: incluye automáticamente obras sociales activas
Paciente.addScope(
  "defaultScope",
  {
    include: [
      {
        model: ObraSocial,
        through: {
          attributes: ["nro_afiliado", "activo"],
          where: { activo: true },
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
        attributes: ["nro_afiliado", "activo"],
        where: { activo: true },
      },
      required: false,
    },
  ],
});

//configuracion FK historial
Turno.hasMany(HistorialEstadoTurno, { foreignKey: "id_turno", as: "historial" });
HistorialEstadoTurno.belongsTo(Turno, { foreignKey: "id_turno" });

EstadoTurno.hasMany(HistorialEstadoTurno, { foreignKey: "id_estado" });
HistorialEstadoTurno.belongsTo(EstadoTurno, { foreignKey: "id_estado" });

Turno.hasMany(Cobro, { foreignKey: "id_turno" });
Cobro.belongsTo(Turno, { foreignKey: "id_turno" });

Paciente.hasMany(Cobro, { foreignKey: "id_paciente" });
Cobro.belongsTo(Paciente, { foreignKey: "id_paciente" });

Cobro.hasMany(Cuota, { foreignKey: "id_cobro" });
Cuota.belongsTo(Cobro, { foreignKey: "id_cobro" });

const sincronizarModelos = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // NUNCA usar force: true ni alter: true; protege y preserva las tablas existentes
    console.log("Base de datos autenticada y sincronizada de forma segura (sin alter ni force).");
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
  PacienteObraSocial,
  HistorialEstadoTurno,
  Cobro,
  Cuota,
  Usuario,
  sincronizarModelos,
};
