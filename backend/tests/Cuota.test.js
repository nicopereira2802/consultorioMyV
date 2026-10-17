/**
 * MODELO Cuota:
 * id_cuota -> INTEGER ; PK
 * id_cobro -> INTEGER ; FK ; allowNull: false
 * nro_cuota -> INTEGER ; allowNull: false
 * monto_cuota -> DECIMAL(10, 2) ; allowNull: false
 * monto_cobrado -> DECIMAL(10, 2) ; allowNull: true
 * fecha_vencimiento -> DATEONLY ; allowNull: false
 * fecha_cobro -> DATE ; allowNull: true
 * metodo_pago -> ENUM("Efectivo", "Transferencia", "Tarjeta", "Otro") ; allowNull: true
 * estado -> ENUM("Pendiente", "Pagada", "Parcialmente pagada") ; allowNull: false ; default: "Pendiente"
 * vencida -> VIRTUAL ; get() {
 *         const hoy = new Date();
 *         return (
 *           this.estado !== "Pagada" && new Date(this.fecha_vencimiento) < hoy
 *         );
 *       },
 *     },
 * activo -> BOOLEAN ; allowNull: false ; default: true
 *
 * router.use("/api/cuotas", CuotaRoutes);
 *
 * RUTAS:
 * router.get(
 *   "/:cobroId/cuotas",
 *   validarExistencia(Cobro, "cobroId", "params"),
 *   CuotaController.getCuotaByCobroId,
 * );
 *
 * router.get(
 *   "/:id",
 *   validarExistencia(Cuota, "id", "params"),
 *   CuotaController.getCuotaById
 * );
 *
 * router.post(
 *   "/",
 *   validateSchema(createCuotaSchema),
 *   validarExistencia(Cobro, "id", "body"),
 *   CuotaController.createCuota,
 * );
 *
 * router.put(
 *   "/:id",
 *   validateSchema(updateCuotaSchema),
 *   validarExistencia(Cuota, "id", "params"),
 *   CuotaController.updateCuota,
 * );
 *
 * router.patch(
 *   "/:id/cobrar",
 *   validarExistencia(Cuota, "id", "params"),
 *   CuotaController.cobrarCuota,
 * );
 *
 * router.patch(
 *   "/:id/delete",
 *   validarExistencia(Cuota, "id", "params"),
 *   CuotaController.deleteCuota,
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
  Cobro,
  Cuota,
} from "../models/index.model.js";

describe("Suite de Tests Completa para /api/cuotas", () => {
  let cobroId;
  let cuotaId;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();

    // 1. Crear Paciente
    const paciente = await Paciente.create({
      nombre: "Marta",
      apellido: "López",
      dni: "36111222",
      telefono: "3518889999",
    });
    const pacienteId = paciente.id_paciente || paciente.id;

    // 2. Crear Estado de Turno
    const [estado] = await EstadoTurno.findOrCreate({
      where: { estado: "Atendido" },
    });
    const estadoId = estado.id_estado || estado.id;

    // 3. Crear Turno
    const turno = await Turno.create({
      id_paciente: pacienteId,
      id_estado: estadoId,
      fecha_hora_inicio: "2026-10-25T09:00:00.000Z",
      fecha_hora_fin: "2026-10-25T09:30:00.000Z",
      precio_final: 30000.0,
    });
    const turnoId = turno.id_turno || turno.id;

    // 4. Crear Cobro para asociar la Cuota
    const cobro = await Cobro.create({
      id_paciente: pacienteId,
      id_turno: turnoId,
      monto_a_cobrar: 30000.0,
      cant_cuotas: 3,
    });
    cobroId = cobro.id_cobro || cobro.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. POST /api/cuotas (Creación & Zod / FKs)
  // ==========================================
  describe("POST /api/cuotas", () => {
    test("201: Debería crear una cuota correctamente", async () => {
      const payload = {
        id_cobro: cobroId,
        nro_cuota: 1,
        monto_cuota: 10000.0,
        fecha_vencimiento: "2026-11-10",
      };

      const res = await request(app).post("/api/cuotas").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.nro_cuota).toBe(1);
      expect(Number(res.body.data.monto_cuota)).toBe(10000.0);
      expect(res.body.data.estado).toBe("Pendiente");
      expect(res.body.data.activo).toBe(true);

      cuotaId = res.body.data.id_cuota || res.body.data.id;
    });

    // --- ERRORES DE VALIDACIÓN ZOD (400) ---
    test("400 Zod: Falla al omitir campos obligatorios (monto_cuota, nro_cuota, fecha_vencimiento)", async () => {
      const res = await request(app).post("/api/cuotas").send({
        id: cobroId,
        id_cobro: cobroId,
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si monto_cuota o nro_cuota son valores negativos o no numéricos", async () => {
      const res = await request(app).post("/api/cuotas").send({
        id: cobroId,
        id_cobro: cobroId,
        nro_cuota: -1,
        monto_cuota: "invalido",
        fecha_vencimiento: "2026-11-10",
      });

      expect(res.status).toBe(400);
    });

    // --- MIDDLEWARE validarExistencia (404) ---
    test("404: Falla si el Cobro no existe en la BD", async () => {
      const res = await request(app).post("/api/cuotas").send({
        id: 99999,
        id_cobro: 99999,
        nro_cuota: 1,
        monto_cuota: 10000.0,
        fecha_vencimiento: "2026-11-10",
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 2. GET /api/cuotas/:cobroId/cuotas (Obtener por Cobro)
  // ==========================================
  describe("GET /api/cuotas/:cobroId/cuotas", () => {
    test("200: Debería obtener las cuotas vinculadas a un ID de Cobro", async () => {
      const res = await request(app).get(`/api/cuotas/${cobroId}/cuotas`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id_cobro).toBe(cobroId);
    });

    test("404: Middleware responderá 404 si el Cobro no existe", async () => {
      const res = await request(app).get("/api/cuotas/99999/cuotas");

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 3. GET /api/cuotas/:id (Obtener por ID de Cuota)
  // ==========================================
  describe("GET /api/cuotas/:id", () => {
    test("200: Debería obtener la cuota por su ID e incluir el getter virtual 'vencida'", async () => {
      const res = await request(app).get(`/api/cuotas/${cuotaId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("vencida");
    });

    test("404: Middleware responderá 404 si la Cuota no existe", async () => {
      const res = await request(app).get("/api/cuotas/99999");

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 4. PUT /api/cuotas/:id (Actualización General)
  // ==========================================
  describe("PUT /api/cuotas/:id", () => {
    test("200: Debería actualizar el monto y la fecha de vencimiento", async () => {
      const res = await request(app).put(`/api/cuotas/${cuotaId}`).send({
        id_cobro: cobroId,
        nro_cuota: 1,
        monto_cuota: 12000.0,
        fecha_vencimiento: "2026-11-15",
        estado: "Pendiente",
      });

      expect(res.status).toBe(200);
      expect(Number(res.body.data.monto_cuota)).toBe(12000.0);
      expect(res.body.data.fecha_vencimiento).toBe("2026-11-15");
    });

    test("404: Middleware responde 404 si la Cuota a actualizar no existe", async () => {
      const res = await request(app).put("/api/cuotas/99999").send({
        id_cobro: cobroId,
        nro_cuota: 1,
        monto_cuota: 12000.0,
        fecha_vencimiento: "2026-11-15",
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. PATCH /api/cuotas/:id/cobrar (Registrar Pago)
  // ==========================================
  describe("PATCH /api/cuotas/:id/cobrar", () => {
    test("200: Debería registrar el cobro de la cuota correctamente", async () => {
      const payloadCobro = {
        monto_cobrado: 12000.0,
        metodo_pago: "Efectivo",
        fecha_cobro: new Date().toISOString(),
      };

      const res = await request(app)
        .patch(`/api/cuotas/${cuotaId}/cobrar`)
        .send(payloadCobro);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Number(res.body.data.monto_cobrado)).toBe(12000.0);
      expect(res.body.data.metodo_pago).toBe("Efectivo");
      expect(res.body.data.estado).toBe("Pagada");
    });

    test("400: Falla al intentar registrar cobro con método de pago no válido", async () => {
      const res = await request(app)
        .patch(`/api/cuotas/${cuotaId}/cobrar`)
        .send({
          monto_cobrado: 12000.0,
          metodo_pago: "MetodoInvalido",
        });

      expect([400, 422]).toContain(res.status);
    });

    test("404: Middleware responde 404 al intentar cobrar una cuota inexistente", async () => {
      const res = await request(app).patch("/api/cuotas/99999/cobrar").send({
        monto_cobrado: 1000,
        metodo_pago: "Transferencia",
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 6. PATCH /api/cuotas/:id/delete (Borrado Lógico)
  // ==========================================
  describe("PATCH /api/cuotas/:id/delete (Borrado Lógico)", () => {
    test("200: Debería marcar la cuota como inactiva (activo = false)", async () => {
      const res = await request(app).patch(`/api/cuotas/${cuotaId}/delete`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      // Verificación directa en base de datos
      const cuotaBD = await Cuota.findByPk(cuotaId);
      expect(cuotaBD.activo).toBe(false);
    });

    test("404: Middleware responde 404 al intentar dar de baja una cuota inexistente", async () => {
      const res = await request(app).patch("/api/cuotas/99999/delete");

      expect(res.status).toBe(404);
    });
  });
});
