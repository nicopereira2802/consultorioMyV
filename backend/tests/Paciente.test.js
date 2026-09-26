/** @format */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";

/*
Modelo de paciente

nombre -> String
apellido -> String
dni -> INT
fecha_nacimiento -> DATE
telefono -> String -> UNIQUE
domicilio -> String
*/

describe("Endpoints de /api/pacientes", () => {
  // CRUCIAL: Crear las tablas en la memoria de SQLite antes de ejecutar los tests
  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos(); // O usa: await sequelize.sync({ force: true });
  });

  // Cerrar la conexión al terminar la suite
  afterAll(async () => {
    await sequelize.close();
  });

  // 1. POST / (Creación exitosa)
  test("Debería crear un nuevo paciente correctamente (201)", async () => {
    const res = await request(app).post("/api/pacientes").send({
      nombre: "Ana",
      apellido: "Maria",
      dni: 11111111,
      fecha_nacimiento: "2000-09-06",
      telefono: "222222222",
      domicilio: "1234 calle 1",
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toHaveProperty("id_paciente");

    // Guardamos el ID para usarlo en los siguientes tests
    pacienteId = res.body.data.id_paciente;
  });

  // 2. POST / (Fallo por no pasar todos los datos obligatiorios)
  test("Debería devolver 400 si faltan campos obligatorios", async () => {
    const res = await request(app).post("/api/pacientes").send({
      apellido: "Maria",
      dni: 11111111,
      fecha_nacimiento: "2000-09-06",
      telefono: "222222222",
      domicilio: "1234 calle 1",
    }); // Sin nombre

    expect(res.status).toBe(400);
  });

  // 3. POST / (Fallo por tipo incorrecto de dato)
  test("Debería devolver 400 si faltan campos obligatorios", async () => {
    const res = await request(app).post("/api/pacientes").send({
      nombre: 12,
      apellido: "Maria",
      dni: 11111111,
      fecha_nacimiento: "2000-09-06",
      telefono: "222222222",
      domicilio: "1234 calle 1",
    });

    expect(res.status).toBe(400);
  });

  // 4. POST / (Fallo por caracteres incorrectos en nombre)
  test("Debería devolver 400 si faltan campos obligatorios", async () => {
    const res = await request(app).post("/api/pacientes").send({
      nombre: "Ana{}12",
      apellido: "Maria",
      dni: 11111111,
      fecha_nacimiento: "2000-09-06",
      telefono: "222222222",
      domicilio: "1234 calle 1",
    });

    expect(res.status).toBe(400);
  });

  // 5. GET / (Listar todos)
  test("Debería obtener la lista de pacientes (200)", async () => {
    const res = await request(app).get("/api/pacientes");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 6. GET /:id (Buscar por ID)
  test("Debería obtener una práctica por ID (200)", async () => {
    const res = await request(app).get(`/api/pacientes/${pacienteId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id_paciente).toBe(pacienteId);
  });

  // 7. GET /:id (Error 404 por middleware validarExistencia)
  test("Debería devolver 404 si la práctica no existe", async () => {
    const res = await request(app).get("/api/pacientes/99999");

    expect(res.status).toBe(404);
  });

  // 8. DELETE /:id (Eliminación)
  test("Debería eliminar una práctica existente (200)", async () => {
    const res = await request(app).patch(`/api/pacientes/${pacienteId}/delete`);

    expect(res.status).toBe(200);
  });
});
