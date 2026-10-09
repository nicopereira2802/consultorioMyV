/** @format */

import express from "express";
import * as CobroController from "../controllers/Cobro.controller.js";

import { Cobro, Paciente, Turno } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import {
  createCobroSchema,
  updateCobroSchema,
  createPlanPagoSchema,
} from "../schemas/Cobro.schema.js";

const router = express.Router();

// Rutas para Cobro
router.get(
  "/:turnoId/cobros",
  validarExistencia(Turno, "turnoId", "params"),
  CobroController.getCobroByTurnoId,
);

router.get(
  "/:id",
  validarExistencia(Cobro, "id", "params"),
  CobroController.getCobroById,
);

router.post(
  "/plan-pago",
  validateSchema(createPlanPagoSchema),
  validarExistencia(Turno, "id_turno", "body"),
  validarExistencia(Paciente, "id_paciente", "body"),
  CobroController.crearPlanPago,
);

router.post(
  "/",
  validateSchema(createCobroSchema),
  validarExistencia(Turno, "id_turno", "body"),
  validarExistencia(Paciente, "id_paciente", "body"),
  CobroController.createCobro,
);

router.put(
  "/:id",
  validateSchema(updateCobroSchema),
  validarExistencia(Cobro, "id", "params"),
  CobroController.updateCobro,
);

router.patch(
  "/:id/delete",
  validarExistencia(Cobro, "id", "params"),
  CobroController.deleteCobro,
);
export default router;
