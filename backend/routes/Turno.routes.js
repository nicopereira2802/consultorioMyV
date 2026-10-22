/** @format */

import express from "express";
import * as TurnoController from "../controllers/Turno.controller.js";

import { Turno } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import { atenderTurnoSchema, createTurnoSchema, updateTurnoSchema } from "../schemas/Turno.schema.js";
const router = express.Router();

// Rutas básicas de Turno
router.get("/", TurnoController.getAllTurnos);
router.get("/agenda", TurnoController.getAllTurnosAgenda);

router.get("/atendidos", TurnoController.getAllTurnosAtendidos);

router.get("/paciente/:id_paciente", TurnoController.getTurnosByPacienteId);

router.get("/:id", validarExistencia(Turno, "id", "params"), TurnoController.getTurnoById);

router.post("/", validateSchema(createTurnoSchema), TurnoController.createTurno);

router.put(
  "/:id",
  validateSchema(updateTurnoSchema),
  validarExistencia(Turno, "id", "params"),
  TurnoController.updateTurno,
);

// Finalizar atención en consultorio y registrar prácticas
router.patch(
  "/:id/atender",
  validateSchema(atenderTurnoSchema),
  validarExistencia(Turno, "id", "params"),
  TurnoController.turnoAtendido,
);

// Cancelar turno
router.patch(
  "/:id/cancelar",
  validateSchema(updateTurnoSchema),
  validarExistencia(Turno, "id", "params"),
  TurnoController.turnoCancelado,
);

// Marcar como inasistente
router.patch(
  "/:id/inasistente",
  validateSchema(updateTurnoSchema),
  validarExistencia(Turno, "id", "params"),
  TurnoController.turnoInasistido,
);

// Marcar como reprogramado
router.patch(
  "/:id/reprogramado",
  validarExistencia(Turno, "id", "params"),
  TurnoController.turnoReprogramado,
);

router.patch("/:id/delete", validarExistencia(Turno, "id", "params"), TurnoController.deleteTurno);

export default router;
