/** @format */

import express from "express";
import * as TurnoController from "../controllers/Turno.controller.js";
import * as HistorialController from "../controllers/HistorialEstadoTurno.controller.js";

import { Turno } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";
import { validateSchema } from "../middleware/validateSchema.js";
import {
  atenderTurnoSchema,
  createTurnoSchema,
  updateTurnoSchema,
} from "../schemas/Turno.schema.js";

const router = express.Router();

// ==========================================
// RUTAS DE LECTURA 
// ==========================================
router.get("/", TurnoController.getAllTurnos);
router.get("/agenda", TurnoController.getAllTurnosAgenda);
router.get("/atendidos", TurnoController.getAllTurnosAtendidos);
router.get("/paciente/:id_paciente", TurnoController.getTurnosByPacienteId);

router.get("/:id", validarExistencia(Turno, "id", "params"), TurnoController.getTurnoById);
router.get("/:id/historial", validarExistencia(Turno, "id", "params"), HistorialController.getHistorialTurnoByTurnoId);

// ==========================================
// RUTAS DE ESCRITURA Y MÁQUINA DE ESTADOS
// ==========================================
router.post("/", validateSchema(createTurnoSchema), TurnoController.createTurno);
router.put("/:id", validateSchema(updateTurnoSchema), validarExistencia(Turno, "id", "params"), TurnoController.updateTurno);

router.patch("/:id/atender", validarExistencia(Turno, "id", "params"), validateSchema(atenderTurnoSchema), TurnoController.turnoAtendido);
router.patch("/:id/cancelar", validarExistencia(Turno, "id", "params"), validateSchema(updateTurnoSchema), TurnoController.turnoCancelado);
router.patch("/:id/inasistente", validarExistencia(Turno, "id", "params"), validateSchema(updateTurnoSchema), TurnoController.turnoInasistido);
router.patch("/:id/reprogramado", validarExistencia(Turno, "id", "params"), TurnoController.turnoReprogramado);
router.patch("/:id/delete", validarExistencia(Turno, "id", "params"), TurnoController.deleteTurno);

export default router;