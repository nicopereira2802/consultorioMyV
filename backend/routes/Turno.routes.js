/** @format */

import express from "express";
import * as TurnoController from "../controllers/Turno.controller.js";

import { Turno } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import {
  createTurnoSchema,
  updateTurnoSchema,
} from "../schemas/Turno.schema.js";
const router = express.Router();

// Rutas básicas de Turno

//Opciones y rutas del GET
/**
* Query Params aceptados:
 * page       (number): Número de página (default: 1)
 * limit      (number): Registros por página (default: 10)
 * search     (string): Coincidencia en notas o datos de Paciente (nombre, apellido, DNI)
 * sortField  (string): Campo a ordenar (default: "fecha_hora_inicio")
 * sortOrder  (string): "ASC" o "DESC" (default: "ASC")
 * 
 * Agenda general:        GET /api/turnos?page=1&limit=10
 * Buscar por paciente:   GET /api/turnos?search=perez
 * Turnos más próximos:   GET /api/turnos?sortField=fecha_hora_inicio&sortOrder=ASC
 */
router.get("/", TurnoController.getAllTurnos);

router.get(
  "/:id",
  validarExistencia(Turno, "id", "params"),
  TurnoController.getTurnoById,
);

router.post(
  "/",
  validateSchema(createTurnoSchema),
  TurnoController.createTurno,
);

router.put(
  "/:id",
  validateSchema(updateTurnoSchema),
  validarExistencia(Turno, "id", "params"),
  TurnoController.updateTurno,
);

// Finalizar atención en consultorio y registrar prácticas
router.patch(
  "/:id/atender",
  validateSchema(updateTurnoSchema),
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
  TurnoController.turnoCancelado,
);

// Marcar como reprogramado
router.patch(
  "/:id/reprogramado",
  validarExistencia(Turno, "id", "params"),
  TurnoController.turnoReprogramado,
);

router.delete(
  "/:id",
  validarExistencia(Turno, "id", "params"),
  TurnoController.deleteTurno,
);

export default router;
