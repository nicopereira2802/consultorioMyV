/** @format */

import express from "express";
import * as PracticaTurnoController from "../controllers/PracticaTurno.controller.js";

import { PracticaTurno, Turno, Practica } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import {
  createPracticaTurnoSchema,
  updatePracticaTurnoSchema,
} from "../schemas/PracticaTurno.schema.js";

const router = express.Router();

// Rutas para Practica por Turno
/** Ejemplo de uso:
 * Prácticas de una atención: GET /api/practicas-turnos?id_turno=25
 * Listado general paginado:  GET /api/practicas-turnos?page=1&limit=15
 */
router.get("/", PracticaTurnoController.getAllPracticaTurno);

router.get(
  "/:id",
  validarExistencia(PracticaTurno, "id", "params"),
  PracticaTurnoController.getPracticaTurnoById,
);
router.post(
  "/",
  validateSchema(createPracticaTurnoSchema),
  validarExistencia(Turno, "turno_id", "body"),
  validarExistencia(Practica, "practica_id", "body"),
  PracticaTurnoController.createPracticaTurno,
);
router.put(
  "/:id",
  validateSchema(updatePracticaTurnoSchema),
  validarExistencia(PracticaTurno, "id", "params"),
  PracticaTurnoController.updatePracticaTurno,
);
router.delete(
  "/:id",
  validarExistencia(PracticaTurno, "id", "params"),
  PracticaTurnoController.deletePracticaTurno,
);

export default router;
