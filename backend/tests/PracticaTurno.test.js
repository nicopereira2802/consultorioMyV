/**
 * MODELO PracticaTurno
 *
 * id_practica_turno -> INTEGER ; PK
 * id_turno -> INTEGER ; FK
 * id_practica -> INTEGER ; FK
 * id_obra_social -> INTEGER ; FK
 *
 * indexes: [
 *       {
 *         unique: true,
 *         fields: ["id_turno", "id_practica", "id_obra_social"],
 *       },
 *
 * router.use("/api/practicas-turnos", PracticaTurnoRoutes);
 *
 * RUTAS:
 * router.get("/", PracticaTurnoController.getAllPracticaTurno);
 * router.get(
 *   "/:id",
 *   validarExistencia(PracticaTurno, "id", "params"),
 *   PracticaTurnoController.getPracticaTurnoById,
 * );
 * router.post(
 *   "/",
 *   validateSchema(createPracticaTurnoSchema),
 *   validarExistencia(Turno, "turno_id", "body"),
 *   validarExistencia(Practica, "practica_id", "body"),
 *   PracticaTurnoController.createPracticaTurno,
 * );
 * router.put(
 *   "/:id",
 *   validateSchema(updatePracticaTurnoSchema),
 *   validarExistencia(PracticaTurno, "id", "params"),
 *   PracticaTurnoController.updatePracticaTurno,
 * );
 * router.delete(
 *   "/:id",
 *   validarExistencia(PracticaTurno, "id", "params"),
 *   PracticaTurnoController.deletePracticaTurno,
 * );
 *
 * @format
 */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";
import {
  Paciente,
  EstadoTurno,
  Turno,
  Practica,
  ObraSocial,
} from "../models/index.model.js";

describe("Suite de Tests Completa para /api/practicas-turnos", () => {
  let turnoId;
  let practicaId;
  let obraSocialId;
  let practicaTurnoId;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();

    // 1. Crear Estado y Paciente para el Turno
    const [estado] = await EstadoTurno.findOrCreate({
      where: { estado: "Programado" },
    });
    const estadoId = estado.id_estado || estado.id;

    const paciente = await Paciente.create({
      nombre: "Agustín",
      apellido: "Pérez",
      dni: "39111222",
      telefono: "3516667777",
    });
    const pacienteId = paciente.id_paciente || paciente.id;

    // 2. Crear Turno
    const turno = await Turno.create({
      id_paciente: pacienteId,
      id_estado: estadoId,
      fecha_hora_inicio: "2026-11-01T09:00:00.000Z",
      fecha_hora_fin: "2026-11-01T010:00:00.000Z",
      precio_final: 20000,
      notas_consulta: "Consulta general de revisión",
    });
    turnoId = turno.id_turno || turno.id;

    // 3. Crear Práctica
    const practica = await Practica.create({
      codigo_nomenclador: "01.01",
      nombre_nomenclador: "Examen, diagnostico y plan de tratamiento",
      nombre_referencia: "Consulta General",
      especialidad: "Odontología General",
      precio_referencia: 15000.5,
    });
    practicaId = practica.id_practica || practica.id;

    // 4. Crear Obra Social
    const obraSocial = await ObraSocial.create({
      nombre: "OSDE",
    });
    obraSocialId = obraSocial.id_obra_social || obraSocial.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. POST /api/practicas-turnos (Asociación & Unique Constraint)
  // ==========================================
  describe("POST /api/practicas-turnos", () => {
    test("201: Debe registrar una práctica en un turno exitosamente", async () => {
      const payload = {
        id_turno: turnoId,
        id_practica: practicaId,
        id_obra_social: obraSocialId,
      };

      const res = await request(app)
        .post("/api/practicas-turnos")
        .send(payload);
        
      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");

      practicaTurnoId = res.body.data.id_practica_turno || res.body.data.id;
    });

    test("400/409/500: Falla al intentar duplicar la misma tripleta (Unique Constraint)", async () => {
      const payloadDuplicado = {
        id_turno: turnoId,
        turno_id: turnoId,
        id_practica: practicaId,
        practica_id: practicaId,
        id_obra_social: obraSocialId,
      };

      const res = await request(app)
        .post("/api/practicas-turnos")
        .send(payloadDuplicado);

      // Si el handler intercepta el error de SequelizeUniqueConstraintError retorna 400 o 409
      expect([400, 409, 500]).toContain(res.status);
    });

    // --- ERRORES DE VALIDACIÓN ZOD (400) ---
    test("400 Zod: Falla si se omiten campos requeridos", async () => {
      const res = await request(app).post("/api/practicas-turnos").send({
        id_turno: turnoId,
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si los IDs no son enteros válidos", async () => {
      const res = await request(app).post("/api/practicas-turnos").send({
        id_turno: "invalido",
        turno_id: "invalido",
        id_practica: practicaId,
        practica_id: practicaId,
        id_obra_social: obraSocialId,
      });

      expect(res.status).toBe(400);
    });

    // --- MIDDLEWARE validarExistencia (404) ---
    test("404: Falla si el Turno no existe en la BD", async () => {
      const res = await request(app).post("/api/practicas-turnos").send({
        id_turno: 99999,
        turno_id: 99999,
        id_practica: practicaId,
        practica_id: practicaId,
        id_obra_social: obraSocialId,
      });

      expect(res.status).toBe(404);
    });

    test("404: Falla si la Práctica no existe en la BD", async () => {
      const res = await request(app).post("/api/practicas-turnos").send({
        id_turno: turnoId,
        turno_id: turnoId,
        id_practica: 99999,
        practica_id: 99999,
        id_obra_social: obraSocialId,
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 2. GET /api/practicas-turnos (Listar todos)
  // ==========================================
  describe("GET /api/practicas-turnos", () => {
    test("200: Debería listar todas las prácticas de turnos", async () => {
      const res = await request(app).get("/api/practicas-turnos");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 3. GET /api/practicas-turnos/:id (Obtener por ID)
  // ==========================================
  describe("GET /api/practicas-turnos/:id", () => {
    test("200: Debería obtener el registro por su ID", async () => {
      const res = await request(app).get(
        `/api/practicas-turnos/${practicaTurnoId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });

    test("404: Middleware validarExistencia responde 404 si el ID no existe", async () => {
      const res = await request(app).get("/api/practicas-turnos/99999");

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 4. PUT /api/practicas-turnos/:id (Actualización)
  // ==========================================
  describe("PUT /api/practicas-turnos/:id", () => {
    test("200: Debería actualizar correctamente el registro", async () => {
      // Creamos una segunda Obra Social para modificar la FK
      const otraObraSocial = await ObraSocial.create({
        nombre: "Swiss Medical",
      });
      const otraObraSocialId =
        otraObraSocial.id_obra_social || otraObraSocial.id;

      const res = await request(app)
        .put(`/api/practicas-turnos/${practicaTurnoId}`)
        .send({
          id_turno: turnoId,
          id_practica: practicaId,
          id_obra_social: otraObraSocialId,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.id_obra_social).toBe(otraObraSocialId);
    });

    test("404: Middleware validarExistencia responde 404 al actualizar un ID inexistente", async () => {
      const res = await request(app).put("/api/practicas-turnos/99999").send({
        id_turno: turnoId,
        id_practica: practicaId,
        id_obra_social: obraSocialId,
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. DELETE /api/practicas-turnos/:id (Eliminación)
  // ==========================================
  describe("DELETE /api/practicas-turnos/:id", () => {
    test("200: Debería eliminar el registro de práctica-turno", async () => {
      const res = await request(app).delete(
        `/api/practicas-turnos/${practicaTurnoId}`,
      );

      expect(res.status).toBe(200);
    });

    test("404: Middleware validarExistencia responde 404 al borrar registro inexistente", async () => {
      const res = await request(app).delete("/api/practicas-turnos/99999");

      expect(res.status).toBe(404);
    });
  });
});
