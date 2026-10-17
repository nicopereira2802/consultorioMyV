/**
 * MODELO HistorialEstadoTurno:
 * id_historial -> INTEGER ; PK
 * id_turno -> INTEGER ; FK ; allowNull: false
 * id_estado -> INTEGER ; FK ; allowNull: false
 * fecha_hora_cambio -> DATE ; allowNull: false ; default: DataTypes.NOW
 * descripcion -> STRING ; allowNull: true
 *
 * router.use("/api/historial-estado-turnos", HistorialEstadoTurnoRoutes);
 *
 * RUTAS:
 * router.get('/:id', HistorialEstadoTurno.getHistorialTurnoByTurnoId)
 *
 * @format
 */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";
import {
  Paciente,
  Turno,
  EstadoTurno,
  HistorialEstadoTurno,
} from "../models/index.model.js";

describe("Suite de Tests Completa para /api/historial-estado-turnos", () => {
  let pacienteId;
  let turnoId;
  let estadoProgramadoId;
  let estadoAtendidoId;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();

    // 1. Poblar la tabla de Estados de Turno (Lookup table)
    const [estadoProg] = await EstadoTurno.findOrCreate({
      where: { estado: "Programado" },
    });
    const [estadoAtend] = await EstadoTurno.findOrCreate({
      where: { estado: "Atendido" },
    });

    estadoProgramadoId = estadoProg.id_estado || estadoProg.id;
    estadoAtendidoId = estadoAtend.id_estado || estadoAtend.id;

    // 2. Crear Paciente
    const paciente = await Paciente.create({
      nombre: "Martín",
      apellido: "Ríos",
      telefono: "3514445555",
    });
    pacienteId = paciente.id_paciente || paciente.id;

    // 3. Crear Turno
    const turno = await Turno.create({
      id_paciente: pacienteId,
      id_estado: estadoProgramadoId,
      fecha_hora_inicio: "2026-10-05T14:30:00.000Z",
      fecha_hora_fin: "2026-10-05T15:30:00.000Z",
      precio_final: 10,
    });
    turnoId = turno.id_turno || turno.id;

    // 4. Crear entradas de historial asociadas al turno
    await HistorialEstadoTurno.bulkCreate([
      {
        id_turno: turnoId,
        id_estado: estadoProgramadoId,
        fecha_hora_cambio: new Date("2026-10-01T10:00:00.000Z"),
        descripcion: "Turno creado inicialmente",
      },
      {
        id_turno: turnoId,
        id_estado: estadoAtendidoId,
        fecha_hora_cambio: new Date("2026-10-05T15:00:00.000Z"),
        descripcion: "Atendido por el profesional",
      },
    ]);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. GET /api/historial-estado-turnos/:id
  // ==========================================
  describe("GET /api/historial-estado-turnos/:id (Obtener historial por ID de turno)", () => {
    test("200: Debería obtener todo el historial de cambios de estado asociados a un turno existente", async () => {
      const res = await request(app).get(
        `/api/historial-estado-turnos/${turnoId}`,
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);

      // Verificamos que contenga la estructura esperada
      const itemHistorial = res.body.data[0];
      expect(itemHistorial).toHaveProperty("id_historial");
      expect(itemHistorial.id_turno).toBe(turnoId);
      expect(itemHistorial).toHaveProperty("id_estado");
      expect(itemHistorial).toHaveProperty("fecha_hora_cambio");
      expect(itemHistorial).toHaveProperty("descripcion");
    });

    test("200 o 404: Debería responder adecuadamente cuando el turno existe pero no posee registros de historial", async () => {
      // Crear un turno sin historial asociado
      const turnoSinHistorial = await Turno.create({
        id_paciente: pacienteId,
        id_estado: estadoProgramadoId,
        fecha_hora_inicio: "2026-10-10T11:00:00.000Z",
        fecha_hora_fin: "2026-10-10T12:30:00.000Z",
        precio_final: 10,
      });
      const nuevoTurnoId = turnoSinHistorial.id_turno || turnoSinHistorial.id;

      const res = await request(app).get(
        `/api/historial-estado-turnos/${nuevoTurnoId}`,
      );

      // Si el controller devuelve un array vacío
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(0);
      } else {
        expect(res.status).toBe(404);
      }
    });

    test("404 o 200 (vacío): Debería responder si el ID de turno solicitado no existe en la BD", async () => {
      const res = await request(app).get("/api/historial-estado-turnos/99999");

      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(0);
      }
    });

    test("400 o 404: Falla si el ID enviado en la URL no es un entero válido", async () => {
      const res = await request(app).get("/api/historial-estado-turnos/abc");

      expect([400, 404]).toContain(res.status);
    });
  });
});
