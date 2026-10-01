/**
 * MODELO EstadoTurno:
 * id_estado -> INTEGER ; PK
 * estado -> ENUM( "Programado", "Cancelado", "Atendido", "Inasistente",) ; allowNull: false ; unique: true
 *
 * RUTAS:
 * NO TIENE, LAS CREO PARA TESTEAR? O NO HACE FALTA?
 *
 * @format
 */

import sequelize from "../config/database.js";
import { EstadoTurno } from "../models/index.model.js";

describe("Modelo EstadoTurno", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  test("Debe crear un estado de turno válido", async () => {
    const estado = await EstadoTurno.create({ estado: "Programado" });
    expect(estado.id_estado).toBeDefined();
    expect(estado.estado).toBe("Programado");
  });

  test("No debe permitir un estado repetido (unique constraint)", async () => {
    await EstadoTurno.create({ estado: "Atendido" });
    await expect(EstadoTurno.create({ estado: "Atendido" })).rejects.toThrow();
  });

  test("No debe permitir un valor fuera del ENUM", async () => {
    await expect(
      EstadoTurno.create({ estado: "EstadoInexistente" }),
    ).rejects.toThrow();
  });
});
