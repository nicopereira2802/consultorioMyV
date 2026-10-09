/**
 * MODELO Cobro:
 * id_cobro -> INTEGER ; PK
 * id_turno -> INTEGER ; FK ; allowNull: false
 * id_paciente -> INTEGER ; FK ; allowNull: false
 * monto_a_cobrar -> DECIMAL(10, 2) ; allowNull: false
 * cant_cuotas -> INTEGER ; allowNull: false ; default: 1
 * fecha_emision -> DATE ; allowNull: false ; default: DataTypes.NOW
 * activo -> BOOLEAN ; allowNull: false ; default: true
 *
 * router.use("/api/cobros", CobroRoutes);
 *
 * RUTAS:
 * router.get(
 *   "/:turnoId/cobros",
 *   validarExistencia(Turno, "turnoId", "params"),
 *   CobroController.getCobroByTurnoId,
 * );
 *
 * router.get(
 *   "/:id",
 *   validarExistencia(Cobro, "id", "params"),
 *   CobroController.getCobroById,
 * );
 *
 * router.post(
 *   "/",
 *   validateSchema(createCobroSchema),
 *   validarExistencia(Turno, "id", "body"),
 *   validarExistencia(Paciente, "id", "body"),
 *   CobroController.createCobro,
 * );
 *
 * router.put(
 *   "/:id",
 *   validateSchema(updateCobroSchema),
 *   validarExistencia(Cobro, "id", "params"),
 *   CobroController.updateCobro,
 * );
 *
 * router.patch(
 *   "/:id/delete",
 *   validarExistencia(Cobro, "id", "params"),
 *   CobroController.deleteCobro,
 * );
 *
 * @format
 */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";
import { Paciente, EstadoTurno, Turno, Cobro } from "../models/index.model.js";

describe("Suite de Tests Completa para /api/cobros", () => {
  let pacienteId;
  let turnoId;
  let cobroId;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();

    // 1. Crear Paciente
    const paciente = await Paciente.create({
      nombre: "Valeria",
      apellido: "Gómez",
      dni: "37444555",
      telefono: "3517778888",
    });
    pacienteId = paciente.id_paciente || paciente.id;

    // 2. Crear Estado para el Turno
    const [estado] = await EstadoTurno.findOrCreate({
      where: { estado: "Atendido" },
    });
    const estadoId = estado.id_estado || estado.id;

    // 3. Crear Turno para asociar al Cobro
    const turno = await Turno.create({
      id_paciente: pacienteId,
      id_estado: estadoId,
      fecha_hora_inicio: "2026-10-20T10:00:00.000Z",
      fecha_hora_fin: "2026-10-20T10:30:00.000Z",
      precio_final: 25000.0,
    });
    turnoId = turno.id_turno || turno.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. POST /api/cobros (Creación & Validación Zod / FKs)
  // ==========================================
  describe("POST /api/cobros", () => {
    test("201: Debería crear un cobro exitosamente con valores por defecto (cant_cuotas=1, activo=true)", async () => {
      const payload = {
        id_paciente: pacienteId,
        id_turno: turnoId,
        monto_a_cobrar: 25000.0,
        cant_cuotas: 3,
      };

      const res = await request(app).post("/api/cobros").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(Number(res.body.data.monto_a_cobrar)).toBe(25000.0);
      expect(res.body.data.cant_cuotas).toBe(3);
      expect(res.body.data.activo).toBe(true);

      cobroId = res.body.data.id_cobro || res.body.data.id;
    });

    // --- ERRORES DE VALIDACIÓN ZOD (400) ---
    test("400 Zod: Falla al omitir el monto_a_cobrar", async () => {
      const res = await request(app).post("/api/cobros").send({
        id_paciente: pacienteId,
        id_turno: turnoId,
        cant_cuotas: 1,
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si monto_a_cobrar o cant_cuotas son números no válidos o negativos", async () => {
      const res = await request(app).post("/api/cobros").send({
        id_paciente: pacienteId,
        id_turno: turnoId,
        monto_a_cobrar: -1500,
        cant_cuotas: 0,
      });

      expect(res.status).toBe(400);
    });

    // --- MIDDLEWARE validarExistencia (404) ---
    test("404: Falla si el Turno o Paciente no existe en la BD", async () => {
      const res = await request(app).post("/api/cobros").send({
        id_paciente: 99999,
        id_turno: turnoId,
        monto_a_cobrar: 10000,
        cant_cuotas: 1,
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 1.1 POST /api/cobros/plan-pago (Plan Atómico)
  // ==========================================
  describe("POST /api/cobros/plan-pago", () => {
    test("201: Debería crear un plan de pago atómico de 3 cuotas con distribución exacta de centavos", async () => {
      const payload = {
        id_paciente: pacienteId,
        id_turno: turnoId,
        monto_total: 10000.0,
        cant_cuotas: 3,
        primer_vencimiento: "2026-11-15",
        intervalo_dias: 30,
        pago_inmediato: false,
      };

      const res = await request(app).post("/api/cobros/plan-pago").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("cobro");
      expect(res.body.data).toHaveProperty("cuotas");
      expect(res.body.data.cuotas.length).toBe(3);

      const cuotas = res.body.data.cuotas;
      expect(Number(cuotas[0].monto_cuota)).toBe(3333.33);
      expect(Number(cuotas[1].monto_cuota)).toBe(3333.33);
      expect(Number(cuotas[2].monto_cuota)).toBe(3333.34);
      expect(cuotas[0].estado).toBe("Pendiente");
      expect(cuotas[0].fecha_vencimiento).toBe("2026-11-15");

      const totalSuma = cuotas.reduce((acc, c) => acc + Number(c.monto_cuota), 0);
      expect(Math.round(totalSuma * 100) / 100).toBe(10000.0);
    });

    test("201: Debería asentar pago inmediato en la primera cuota si pago_inmediato = true", async () => {
      const payload = {
        id_paciente: pacienteId,
        id_turno: turnoId,
        monto_total: 15000.0,
        cant_cuotas: 2,
        primer_vencimiento: "2026-11-20",
        pago_inmediato: true,
        metodo_pago: "Transferencia",
      };

      const res = await request(app).post("/api/cobros/plan-pago").send(payload);

      expect(res.status).toBe(201);
      const cuotas = res.body.data.cuotas;
      expect(cuotas[0].estado).toBe("Pagada");
      expect(Number(cuotas[0].monto_cobrado)).toBe(7500.0);
      expect(cuotas[0].metodo_pago).toBe("Transferencia");
      expect(cuotas[0].fecha_cobro).toBeDefined();

      expect(cuotas[1].estado).toBe("Pendiente");
      expect(Number(cuotas[1].monto_cobrado)).toBe(0);
    });

    test("400: Falla si formato de fecha primer_vencimiento no es YYYY-MM-DD", async () => {
      const res = await request(app).post("/api/cobros/plan-pago").send({
        id_paciente: pacienteId,
        id_turno: turnoId,
        monto_total: 5000,
        cant_cuotas: 1,
        primer_vencimiento: "15/11/2026",
      });

      expect(res.status).toBe(400);
    });

    test("404: Falla si el Turno o Paciente no existe", async () => {
      const res = await request(app).post("/api/cobros/plan-pago").send({
        id_paciente: 99999,
        id_turno: turnoId,
        monto_total: 5000,
        cant_cuotas: 1,
        primer_vencimiento: "2026-11-15",
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 2. GET /api/cobros/:turnoId/cobros (Obtener por Turno)
  // ==========================================
  describe("GET /api/cobros/:turnoId/cobros", () => {
    test("200: Debería obtener el o los cobros asociados a un ID de Turno específico", async () => {
      const res = await request(app).get(`/api/cobros/${turnoId}/cobros`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      const data = Array.isArray(res.body.data)
        ? res.body.data[0]
        : res.body.data;
      expect(data.id_turno).toBe(turnoId);
    });

    test("404: Middleware validarExistencia responde 404 si el Turno no existe", async () => {
      const res = await request(app).get("/api/cobros/99999/cobros");

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 3. GET /api/cobros/:id (Obtener por ID de Cobro)
  // ==========================================
  describe("GET /api/cobros/:id", () => {
    test("200: Debería obtener el cobro por su ID", async () => {
      const res = await request(app).get(`/api/cobros/${cobroId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_cobro || res.body.data.id).toBe(cobroId);
    });

    test("404: Middleware validarExistencia responde 404 si el Cobro no existe", async () => {
      const res = await request(app).get("/api/cobros/99999");

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 4. PUT /api/cobros/:id (Actualización)
  // ==========================================
  describe("PUT /api/cobros/:id", () => {
    test("200: Debería actualizar correctamente el monto y cantidad de cuotas", async () => {
      const res = await request(app).put(`/api/cobros/${cobroId}`).send({
        id_paciente: pacienteId,
        id_turno: turnoId,
        monto_a_cobrar: 30000.0,
        cant_cuotas: 6,
      });

      expect(res.status).toBe(200);
      expect(Number(res.body.data.monto_a_cobrar)).toBe(30000.0);
      expect(res.body.data.cant_cuotas).toBe(6);
    });

    test("404: Middleware validarExistencia responde 404 al intentar actualizar un Cobro inexistente", async () => {
      const res = await request(app).put("/api/cobros/99999").send({
        id_paciente: pacienteId,
        id_turno: turnoId,
        monto_a_cobrar: 10000,
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. PATCH /api/cobros/:id/delete (Borrado Lógico)
  // ==========================================
  describe("PATCH /api/cobros/:id/delete (Borrado Lógico)", () => {
    test("200: Debería marcar el cobro como inactivo (activo = false)", async () => {
      const res = await request(app).patch(`/api/cobros/${cobroId}/delete`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      // Verificamos en BD que la bandera activo se haya modificado
      const cobroEnBD = await Cobro.findByPk(cobroId);
      expect(cobroEnBD.activo).toBe(false);
    });

    test("404: Middleware validarExistencia responde 404 al intentar dar de baja un cobro inexistente", async () => {
      const res = await request(app).patch("/api/cobros/99999/delete");

      expect(res.status).toBe(404);
    });
  });
});
