/**
 * MODELO PacienteObraSocial:
 * id_obra_social -> INTEGER ; PK ; FK
 * id_paciente -> INTEGER ; PK ; FK
 * nro_afiliado -> STRING ; allowNull: false
 *
 * router.use("/api/pacientes-por-obras-sociales", PacienteObraSocialRoutes);
 *
 * RUTAS:
 * router.get("/", PacienteObraSocialController.getAllPacientesPorObraSocial);
 *
 * router.get(
 *   "/:id",
 *   validarExistencia(PacienteObraSocial, "id", "params"),
 *   PacienteObraSocialController.getPacientePorObraSocialById,
 * );
 * router.post(
 *   "/",
 *   validateSchema(createPacienteObraSocialSchema),
 *   validarExistencia(Paciente, "id_paciente", "body"),
 *   validarExistencia(ObraSocial, "id_obra_social", "body"),
 *   PacienteObraSocialController.createPacientePorObraSocial,
 * );
 *
 * router.put(
 *   "/:id",
 *   validateSchema(updatePacienteObraSocialSchema),
 *   validarExistencia(PacienteObraSocial, "id", "params"),
 *   PacienteObraSocialController.updatePacientePorObraSocial,
 * );
 *
 * router.delete(
 *   "/:id",
 *   validarExistencia(PacienteObraSocial, "id", "params"),
 *   PacienteObraSocialController.deletePacientePorObraSocial,
 * );
 *
 * @format
 */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";
import { Paciente, ObraSocial } from "../models/index.model.js";

describe("Suite de Tests Completa para /api/pacientes-por-obras-sociales", () => {
  let pacienteId;
  let obraSocialId;
  let pacienteObraSocialId; // ID o combinación empleada en la ruta /:id

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();

    // 1. Crear Paciente para asociar
    const paciente = await Paciente.create({
      nombre: "Laura",
      apellido: "Gomez",
      dni: "38999888",
      telefono: "3513334444",
    });
    pacienteId = paciente.id_paciente || paciente.id;

    // 2. Crear ObraSocial para asociar
    const obraSocial = await ObraSocial.create({
      nombre: "Sancor Salud",
    });
    obraSocialId = obraSocial.id_obra_social || obraSocial.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. POST /api/pacientes-por-obras-sociales (Asociación & Zod)
  // ==========================================
  describe("POST /api/pacientes-por-obras-sociales", () => {
    test("201: Debería asociar correctamente un paciente con una obra social", async () => {
      const res = await request(app)
        .post("/api/pacientes-por-obras-sociales")
        .send({
          id_paciente: pacienteId,
          id_obra_social: obraSocialId,
          nro_afiliado: "123456789",
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_paciente).toBe(pacienteId);
      expect(res.body.data.id_obra_social).toBe(obraSocialId);
      expect(res.body.data.nro_afiliado).toBe("123456789");

      // Si la tabla pivote usa un ID autonumérico o la clave compuesta
      pacienteObraSocialId =
        res.body.data.id ||
        res.body.data.id_paciente_obra_social ||
        `${obraSocialId}-${pacienteId}`;
    });

    // --- ERRORES DE VALIDACIÓN ZOD (400) ---
    test("400 Zod: Falla al omitir el nro_afiliado", async () => {
      const res = await request(app)
        .post("/api/pacientes-por-obras-sociales")
        .send({
          id_paciente: pacienteId,
          id_obra_social: obraSocialId,
        });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si nro_afiliado no es un string", async () => {
      const res = await request(app)
        .post("/api/pacientes-por-obras-sociales")
        .send({
          id_paciente: pacienteId,
          id_obra_social: obraSocialId,
          nro_afiliado: 11111111,
        });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si se envían IDs de formato inválido", async () => {
      const res = await request(app)
        .post("/api/pacientes-por-obras-sociales")
        .send({
          id_paciente: "invalido",
          id_obra_social: obraSocialId,
          nro_afiliado: "123456",
        });

      expect(res.status).toBe(400);
    });

    // --- MIDDLEWARE validarExistencia (404) ---
    test("404: Falla si el Paciente no existe en la BD", async () => {
      const res = await request(app)
        .post("/api/pacientes-por-obras-sociales")
        .send({
          id_paciente: 99999,
          id_obra_social: obraSocialId,
          nro_afiliado: "123456",
        });

      expect(res.status).toBe(404);
    });

    test("404: Falla si la Obra Social no existe en la BD", async () => {
      const res = await request(app)
        .post("/api/pacientes-por-obras-sociales")
        .send({
          id_paciente: pacienteId,
          id_obra_social: 99999,
          nro_afiliado: "123456",
        });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 2. GET /api/pacientes-por-obras-sociales (Listar todos)
  // ==========================================
  describe("GET /api/pacientes-por-obras-sociales", () => {
    test("200: Debería obtener la lista de relaciones paciente-obra social", async () => {
      const res = await request(app).get("/api/pacientes-por-obras-sociales");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 3. GET /api/pacientes-por-obras-sociales/:id (Obtener por ID)
  // ==========================================
  describe("GET /api/pacientes-por-obras-sociales/:id", () => {
    test("200: Debería obtener la relación solicitada por ID", async () => {
      const res = await request(app).get(
        `/api/pacientes-por-obras-sociales/${pacienteObraSocialId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });

    test("404: Middleware validarExistencia devuelve 404 si la relación no existe", async () => {
      const res = await request(app).get(
        "/api/pacientes-por-obras-sociales/99999",
      );

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 4. PUT /api/pacientes-por-obras-sociales/:id (Actualización)
  // ==========================================
  describe("PUT /api/pacientes-por-obras-sociales/:id", () => {
    test("200: Debería actualizar correctamente el nro_afiliado", async () => {
      const res = await request(app)
        .put(`/api/pacientes-por-obras-sociales/${pacienteObraSocialId}`)
        .send({
          nro_afiliado: "987654321",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nro_afiliado).toBe("987654321");
    });

    test("400 Zod: Falla al intentar actualizar con un nro_afiliado inválido", async () => {
      const res = await request(app)
        .put(`/api/pacientes-por-obras-sociales/${pacienteObraSocialId}`)
        .send({
          nro_afiliado: -10,
        });

      expect(res.status).toBe(400);
    });

    test("404: Middleware validarExistencia devuelve 404 si la relación no existe", async () => {
      const res = await request(app)
        .put("/api/pacientes-por-obras-sociales/99999")
        .send({
          nro_afiliado: "555555",
        });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. DELETE /api/pacientes-por-obras-sociales/:id (Eliminación)
  // ==========================================
  describe("DELETE /api/pacientes-por-obras-sociales/:id", () => {
    test("200: Debería eliminar la asociación existente", async () => {
      const res = await request(app).delete(
        `/api/pacientes-por-obras-sociales/${pacienteObraSocialId}`,
      );

      expect(res.status).toBe(200);
    });

    test("404: Middleware validarExistencia devuelve 404 si la asociación a eliminar no existe", async () => {
      const res = await request(app).delete(
        "/api/pacientes-por-obras-sociales/99999",
      );

      expect(res.status).toBe(404);
    });
  });
});
