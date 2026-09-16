import sequelize from "../config/database.js";

// Importar modelos
import { Paciente } from "./Paciente.model.js";
import { ObraSocial } from "./ObraSocial.model.js";
import { EstadoTurno } from "./EstadoTurno.model.js";
import { Turno } from "./Turno.model.js";
import { Practica } from "./Practica.model.js";
import { PracticaTurno } from "./PracticaTurno.model.js";
import { PacienteObraSocial } from "./PacienteObraSocial.model.js";

// Definir relaciones entre modelos
Paciente.hasMany(Turno, { foreignKey: "id_paciente" });
Turno.belongsTo(Paciente, { foreignKey: "id_paciente" });

EstadoTurno.hasMany(Turno, { foreignKey: "id_estado" });
Turno.belongsTo(EstadoTurno, { foreignKey: "id_estado" });

Practica.hasMany(PracticaTurno, { foreignKey: "id_practica" });
PracticaTurno.belongsTo(Practica, { foreignKey: "id_practica" });

Turno.hasMany(PracticaTurno, { foreignKey: "id_turno" });
PracticaTurno.belongsTo(Turno, { foreignKey: "id_turno" });

Paciente.hasMany(PacienteObraSocial, { foreignKey: "id_paciente" });
PacienteObraSocial.belongsTo(Paciente, { foreignKey: "id_paciente" });

ObraSocial.hasMany(PacienteObraSocial, { foreignKey: "id_obra_social" });
PacienteObraSocial.belongsTo(ObraSocial, { foreignKey: "id_obra_social" });

const sincronizarModelos = async () => {
  try {
    await sequelize.sync({ alter: true }); // Cambiar a true si deseas que Sequelize altere las tablas existentes
    console.log("Base de datos sincronizada correctamente");
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
  sincronizarModelos,
};
