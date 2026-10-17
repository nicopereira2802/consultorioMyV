/**
 * MODELO Turno:
 * id_turno -> INTEGER ; PK
 * id_paciente -> INTEGER ; FK ; allowNull: false
 * id_estado -> INTEGER ; FK ; allowNull: false
 * fecha_hora_inicio -> DATE ; allowNull: false
 * fecha_hora_fin -> DATE ; allowNull: false       IMPORTANTE: NO SE MANDA COMO DATO, SE CALCULA A PARTIR DE LA DURACION
 * duracion_minutos -> INTEGER       IMPORTANTE: NO SE GUARDA EN LA BASE DE DATOS, SOLO SE USA PARA CALCULAR LA FECHA FIN
 * precio_final -> DECIMAL(10, 2) ; allowNull: false
 * notas_consulta -> STRING ; allowNull: true
 *
 * router.use("/api/turnos", TurnoRoutes);
 *
 * RUTAS:
 * router.get("/", TurnoController.getAllTurnos);
 *
 * router.get(
 *   "/:id",
 *   validarExistencia(Turno, "id", "params"),
 *   TurnoController.getTurnoById,
 * );
 *
 * router.post(
 *   "/",
 *   validateSchema(createTurnoSchema),
 *   TurnoController.createTurno,
 * );
 *
 * router.put(
 *   "/:id",
 *   validateSchema(updateTurnoSchema),
 *   validarExistencia(Turno, "id", "params"),
 *   TurnoController.updateTurno,
 * );
 *
 * // Finalizar atención en consultorio y registrar prácticas
 * router.patch(
 *   "/:id/atender",
 *   validateSchema(updateTurnoSchema),
 *   validarExistencia(Turno, "id", "params"),
 *   TurnoController.turnoAtendido,
 * );
 *
 * // Cancelar turno
 * router.patch(
 *   "/:id/cancelar",
 *   validateSchema(updateTurnoSchema),
 *   validarExistencia(Turno, "id", "params"),
 *   TurnoController.turnoCancelado,
 * );
 *
 * // Marcar como inasistente
 * router.patch(
 *   "/:id/inasistente",
 *   validateSchema(updateTurnoSchema),
 *   validarExistencia(Turno, "id", "params"),
 *   TurnoController.turnoCancelado,
 * );
 *
 * // Marcar como reprogramado
 * router.patch(
 *   "/:id/reprogramado",
 *   validarExistencia(Turno, "id", "params"),
 *   TurnoController.turnoReprogramado,
 * );
 *
 * router.delete(
 *   "/:id",
 *   validarExistencia(Turno, "id", "params"),
 *   TurnoController.deleteTurno,
 * );
 *
 * @format
 */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";
import { Paciente, EstadoTurno } from "../models/index.model.js";

describe("Suite de Tests Completa para /api/turnos", () => {
  let pacienteId;
  let estadoProgramadoId;
  let estadoAtendidoId;
  let turnoId;
  let turnoIdCancelado;
  let turnoIdInasistente;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();

    // 1. Poblar estados necesarios
    const [estadoProg] = await EstadoTurno.findOrCreate({
      where: { estado: "Programado" },
    });
    const [estadoAtend] = await EstadoTurno.findOrCreate({
      where: { estado: "Atendido" },
    });

    estadoProgramadoId = estadoProg.id_estado || estadoProg.id;
    estadoAtendidoId = estadoAtend.id_estado || estadoAtend.id;

    // 2. Crear Paciente para los turnos
    const paciente = await Paciente.create({
      nombre: "Carlos",
      apellido: "Gomez",
      dni: "35123456",
      telefono: "3515556666",
    });
    pacienteId = paciente.id_paciente || paciente.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. POST /api/turnos (Creación & Cálculo de Duración)
  // ==========================================
  describe("POST /api/turnos", () => {
    // --- PARA ESTADO ATENDIDO ---
    test("201: Debería crear un turno correctamente y calcular fecha_hora_fin para atendido", async () => {
      const fechaInicio = "2026-10-10T10:00:00.000Z";
      const duracionMinutos = 30;

      const res = await request(app).post("/api/turnos").send({
        id_paciente: pacienteId,
        id_estado: estadoProgramadoId,
        fecha_hora_inicio: fechaInicio,
        duracion_minutos: duracionMinutos,
        precio_final: 15000.5,
        notas_consulta: "Consulta general de revisión",
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_paciente).toBe(pacienteId);
      expect(Number(res.body.data.precio_final)).toBe(15000.5);

      // Verificar que fecha_hora_fin existe y fue calculada (10:00 + 30 min = 10:30)
      expect(res.body.data).toHaveProperty("fecha_hora_fin");
      const fechaFinEsperada = new Date(
        new Date(fechaInicio).getTime() + duracionMinutos * 60000,
      ).toISOString();
      expect(new Date(res.body.data.fecha_hora_fin).toISOString()).toBe(
        fechaFinEsperada,
      );

      turnoId = res.body.data.id_turno || res.body.data.id;
    });

    // --- PARA ESTADO CANCELADO ---
    test("201: Debería crear un turno correctamente y calcular fecha_hora_fin para cancelado", async () => {
      const fechaInicio = "2026-10-10T12:00:00.000Z";
      const duracionMinutos = 30;

      const res = await request(app).post("/api/turnos").send({
        id_paciente: pacienteId,
        id_estado: estadoProgramadoId,
        fecha_hora_inicio: fechaInicio,
        duracion_minutos: duracionMinutos,
        precio_final: 15000.5,
        notas_consulta: "Consulta general de revisión",
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_paciente).toBe(pacienteId);
      expect(Number(res.body.data.precio_final)).toBe(15000.5);

      // Verificar que fecha_hora_fin existe y fue calculada (10:00 + 30 min = 10:30)
      expect(res.body.data).toHaveProperty("fecha_hora_fin");
      const fechaFinEsperada = new Date(
        new Date(fechaInicio).getTime() + duracionMinutos * 60000,
      ).toISOString();
      expect(new Date(res.body.data.fecha_hora_fin).toISOString()).toBe(
        fechaFinEsperada,
      );

      turnoIdCancelado = res.body.data.id_turno || res.body.data.id;
    });

    // --- PARA ESTADO INASISTENTE ---
    test("201: Debería crear un turno correctamente y calcular fecha_hora_fin para inasistente", async () => {
      const fechaInicio = "2026-10-10T15:00:00.000Z";
      const duracionMinutos = 30;

      const res = await request(app).post("/api/turnos").send({
        id_paciente: pacienteId,
        id_estado: estadoProgramadoId,
        fecha_hora_inicio: fechaInicio,
        duracion_minutos: duracionMinutos,
        precio_final: 15000.5,
        notas_consulta: "Consulta general de revisión",
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_paciente).toBe(pacienteId);
      expect(Number(res.body.data.precio_final)).toBe(15000.5);

      // Verificar que fecha_hora_fin existe y fue calculada (10:00 + 30 min = 10:30)
      expect(res.body.data).toHaveProperty("fecha_hora_fin");
      const fechaFinEsperada = new Date(
        new Date(fechaInicio).getTime() + duracionMinutos * 60000,
      ).toISOString();
      expect(new Date(res.body.data.fecha_hora_fin).toISOString()).toBe(
        fechaFinEsperada,
      );

      turnoIdInasistente = res.body.data.id_turno || res.body.data.id;
    });

    // --- ERRORES DE VALIDACIÓN ZOD (400) ---
    test("400 Zod: Falla al omitir campos obligatorios (id_paciente, precio_final, etc.)", async () => {
      const res = await request(app).post("/api/turnos").send({
        fecha_hora_inicio: "2026-10-10T10:00:00.000Z",
        duracion_minutos: 30,
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si fecha_hora_inicio tiene un formato inválido", async () => {
      const res = await request(app).post("/api/turnos").send({
        id_paciente: pacienteId,
        id_estado: estadoProgramadoId,
        fecha_hora_inicio: "fecha-invalida",
        duracion_minutos: 30,
        precio_final: 10000,
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si precio_final es un valor negativo o inválido", async () => {
      const res = await request(app).post("/api/turnos").send({
        id_paciente: pacienteId,
        id_estado: estadoProgramadoId,
        fecha_hora_inicio: "2026-10-10T10:00:00.000Z",
        duracion_minutos: 30,
        precio_final: -500,
      });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // 2. GET /api/turnos (Listar todos)
  // ==========================================
  describe("GET /api/turnos", () => {
    test("200: Debería listar todos los turnos registrados", async () => {
      const res = await request(app).get("/api/turnos");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 3. GET /api/turnos/:id (Obtener por ID)
  // ==========================================
  describe("GET /api/turnos/:id", () => {
    test("200: Debería obtener un turno existente por su ID", async () => {
      const res = await request(app).get(`/api/turnos/${turnoId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_paciente).toBe(pacienteId);
    });

    test("404: Middleware validarExistencia responde 404 si el turno no existe", async () => {
      const res = await request(app).get("/api/turnos/99999");

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 4. PUT /api/turnos/:id (Actualización General)
  // ==========================================
  describe("PUT /api/turnos/:id", () => {
    test("200: Debería actualizar las notas y precio de un turno", async () => {
      const res = await request(app).put(`/api/turnos/${turnoId}`).send({
        id_paciente: pacienteId,
        id_estado: estadoProgramadoId,
        fecha_hora_inicio: "2026-10-10T11:00:00.000Z",
        duracion_minutos: 45,
        precio_final: 18000,
        notas_consulta: "Notas actualizadas",
      });

      expect(res.status).toBe(200);
      expect(Number(res.body.data.precio_final)).toBe(18000);
      expect(res.body.data.notas_consulta).toBe("Notas actualizadas");
    });

    test("404: Middleware validarExistencia responde 404 si el turno a actualizar no existe", async () => {
      const res = await request(app).put("/api/turnos/99999").send({
        id_paciente: pacienteId,
        id_estado: estadoProgramadoId,
        fecha_hora_inicio: "2026-10-10T11:00:00.000Z",
        duracion_minutos: 30,
        precio_final: 18000,
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. RUTAS PATCH (Cambios de estado de Turno)
  // ==========================================
  describe("RUTAS PATCH - Transiciones de Estado", () => {
    test("200: PATCH /:id/atender - Marca el turno como atendido", async () => {
      const res = await request(app)
        .patch(`/api/turnos/${turnoId}/atender`)
        .send({
          id_estado: estadoAtendidoId,
          notas_consulta: "Atención finalizada con éxito",
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
    });

    test("200: PATCH /:id/cancelar - Marca el turno como cancelado", async () => {
      const res = await request(app)
        .patch(`/api/turnos/${turnoIdCancelado}/cancelar`)
        .send({
          notas_consulta: "Cancelado por el paciente",
        });

      expect(res.status).toBe(200);
    });

    test("200: PATCH /:id/inasistente - Marca el turno como inasistente", async () => {
      const res = await request(app)
        .patch(`/api/turnos/${turnoIdInasistente}/inasistente`)
        .send({
          notas_consulta: "El paciente no se presentó",
        });

      expect(res.status).toBe(200);
    });

    test("200: PATCH /:id/reprogramado - Reprograma la fecha del turno", async () => {
      const res = await request(app)
        .patch(`/api/turnos/${turnoIdInasistente}/reprogramado`)
        .send({
          fecha_hora_inicio: "2026-10-15T16:00:00.000Z",
          duracion_minutos: 30,
        });

      expect(res.status).toBe(200);
    });

    test("404: PATCH falla con 404 en turno inexistente", async () => {
      const res = await request(app)
        .patch("/api/turnos/99999/atender")
        .send({});

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 6. DELETE /api/turnos/:id (Eliminación)
  // ==========================================
  describe("DELETE /api/turnos/:id", () => {
    test("200: Debería eliminar el turno correctamente", async () => {
      const res = await request(app).delete(`/api/turnos/${turnoId}`);

      expect(res.status).toBe(200);
    });

    test("404: Middleware validarExistencia responde 404 al intentar borrar turno inexistente", async () => {
      const res = await request(app).delete("/api/turnos/99999");

      expect(res.status).toBe(404);
    });
  });
});
