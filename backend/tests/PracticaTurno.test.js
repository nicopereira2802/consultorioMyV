import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";

describe("POST /practicas-turnos - Validación y Creación de PracticaTurno", () => {
  
  // CRUCIAL: Crear las tablas en la memoria de SQLite antes de ejecutar los tests
  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos(); // O usa: await sequelize.sync({ force: true });
  });

  // Cerrar la conexión al terminar la suite
  afterAll(async () => {
    await sequelize.close();
  });


  // ESCENARIO 1: ÉXITO ----------------------------------------------------------------------------------------------
  test("Debe crear un paciente exitosamente si los datos son válidos", async () => {
    const nuevoPracticaTurno = {
      turno_id: 1,
      practica_id: 1
    };

    const response = await request(app).post("/api/practicas-turnos").send(nuevoPracticaTurno);
    expect(response.statusCode).toBe(201);
  });
});
