/** @format */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";

/*
Modelo de practica

id_practica -> String
codigo_nomenclador -> String
nombre_nomenclador -> String
nombre_referencia -> String
especialidad -> String
precio_referencia -> Float (DECIMAL(10, 2))
*/

describe("Endpoints de /api/practicas", () => {
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
  test("Debería crear una nueva práctica correctamente (201)", async () => {
    const res = await request(app).post("/api/practicas").send({
      codigo_nomenclador: "Limpieza Dental",
      nombre_nomenclador: "Limpieza Dental",
      nombre_referencia: "Limpieza Dental",
      especialidad: "Limpieza",
      precio_referencia: 30,
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("success");
    expect(res.body.data).toHaveProperty("id_practica");

    // Guardamos el ID para usarlo en los siguientes tests
    practicaId = res.body.data.id_practica;
  });

  // 2. POST / (Fallo por no pasar todos los datos obligatiorios)
  test("Debería devolver 400 si faltan campos obligatorios", async () => {
    const res = await request(app)
      .post("/api/practicas")
      .send({
        codigo_nomenclador: "Limpieza Dental",
        nombre_referencia: "Limpieza Dental",
        especialidad: "Limpieza",
        precio_referencia: 30,
      }); // Sin nombre

    expect(res.status).toBe(400);
  });

  // 3. POST / (Fallo por tipo incorrecto de dato)
  test("Debería devolver 400 si faltan campos obligatorios", async () => {
    const res = await request(app)
      .post("/api/practicas")
      .send({
        codigo_nomenclador: 10,
        nombre_referencia: "Limpieza Dental",
        especialidad: "Limpieza",
        precio_referencia: 30,
      }); 

    expect(res.status).toBe(400);
  });


  // 4. GET / (Listar todos)
  test("Debería obtener la lista de prácticas (200)", async () => {
    const res = await request(app).get("/api/practicas");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  // 5. GET /:id (Buscar por ID)
  test("Debería obtener una práctica por ID (200)", async () => {
    const res = await request(app).get(`/api/practicas/${practicaId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id_practica).toBe(practicaId);
  });

  // 6. GET /:id (Error 404 por middleware validarExistencia)
  test("Debería devolver 404 si la práctica no existe", async () => {
    const res = await request(app).get("/api/practicas/99999");

    expect(res.status).toBe(404);
  });

  // 7. DELETE /:id (Eliminación)
  test("Debería eliminar una práctica existente (200)", async () => {
    const res = await request(app).patch(`/api/practicas/${practicaId}/delete`);

    expect(res.status).toBe(200);
  });
});
