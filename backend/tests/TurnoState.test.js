/** @format */

import sequelize from "../config/database.js";
import {
  sincronizarModelos,
  Paciente,
  Turno,
  EstadoTurno,
  HistorialEstadoTurno,
} from "../models/index.model.js";
import {
  obtenerEstadoTurno,
  ProgramadoState,
  AtendidoState,
  CanceladoState,
  InasistenteState,
  EstadoTurnoBase,
} from "../states/TurnoState.js";

describe("Suite de Tests para el Patrón State (GoF) en Turnos", () => {
  let pacienteId;
  let estadoProg;
  let estadoAtend;
  let estadoCanc;
  let estadoInas;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();

    [estadoProg] = await EstadoTurno.findOrCreate({ where: { estado: "Programado" } });
    [estadoAtend] = await EstadoTurno.findOrCreate({ where: { estado: "Atendido" } });
    [estadoCanc] = await EstadoTurno.findOrCreate({ where: { estado: "Cancelado" } });
    [estadoInas] = await EstadoTurno.findOrCreate({ where: { estado: "Inasistente" } });

    const paciente = await Paciente.create({
      nombre: "Carlos",
      apellido: "Gómez",
      dni: "30123456",
      telefono: "3511234567",
    });
    pacienteId = paciente.id_paciente;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test("Factory obtenerEstadoTurno retorna instancias correspondientes a cada estado", async () => {
    const estado1 = await obtenerEstadoTurno(estadoProg.id_estado);
    expect(estado1).toBeInstanceOf(ProgramadoState);
    expect(estado1).toBeInstanceOf(EstadoTurnoBase);

    const estado2 = await obtenerEstadoTurno(estadoCanc.id_estado);
    expect(estado2).toBeInstanceOf(CanceladoState);

    const estado3 = await obtenerEstadoTurno(estadoAtend.id_estado);
    expect(estado3).toBeInstanceOf(AtendidoState);

    const estado4 = await obtenerEstadoTurno(estadoInas.id_estado);
    expect(estado4).toBeInstanceOf(InasistenteState);
  });

  test("ProgramadoState permite atender el turno y registra en el historial sin tocar notas_consulta", async () => {
    const turno = await Turno.create({
      id_paciente: pacienteId,
      id_estado: estadoProg.id_estado,
      fecha_hora_inicio: new Date("2026-11-01T10:00:00Z"),
      fecha_hora_fin: new Date("2026-11-01T10:30:00Z"),
      precio_final: 8000,
      notas_consulta: "Motivo inicial de consulta",
    });

    const estadoActual = await obtenerEstadoTurno(turno.id_estado);
    await estadoActual.atender(turno, {
      observacion: "Evolución clínica del paciente: obturación exitosa",
      practicas_realizadas: [],
    });

    await turno.reload();
    expect(turno.id_estado).toBe(estadoAtend.id_estado);
    expect(turno.notas_consulta).toBe("Motivo inicial de consulta");

    const ultimoHistorial = await HistorialEstadoTurno.findOne({
      where: { id_turno: turno.id_turno, id_estado: estadoAtend.id_estado },
      order: [["fecha_hora_cambio", "DESC"]],
    });
    expect(ultimoHistorial).toBeDefined();
    expect(ultimoHistorial.descripcion).toBe("Evolución clínica del paciente: obturación exitosa");
  });

  test("AtendidoState rechaza operaciones de cancelación, inasistencia o doble atención", async () => {
    const atendido = new AtendidoState();
    await expect(atendido.atender(null, {})).rejects.toThrow(/No se puede atender un turno en estado "Atendido"/);
    await expect(atendido.cancelar(null, "motivo")).rejects.toThrow(/No se puede cancelar un turno en estado "Atendido"/);
    await expect(atendido.marcarInasistente(null, "motivo")).rejects.toThrow(/No se puede marcar inasistente un turno en estado "Atendido"/);
  });

  test("CanceladoState rechaza operaciones por ser estado terminal", async () => {
    const cancelado = new CanceladoState();
    await expect(cancelado.atender(null, {})).rejects.toThrow(/No se puede atender un turno en estado "Cancelado"/);
    await expect(cancelado.cancelar(null, "motivo")).rejects.toThrow(/No se puede cancelar un turno en estado "Cancelado"/);
  });

  test("InasistenteState rechaza operaciones por ser estado terminal", async () => {
    const inasistente = new InasistenteState();
    await expect(inasistente.atender(null, {})).rejects.toThrow(/No se puede atender un turno en estado "Inasistente"/);
    await expect(inasistente.marcarInasistente(null, "motivo")).rejects.toThrow(/No se puede marcar inasistente un turno en estado "Inasistente"/);
  });
});
