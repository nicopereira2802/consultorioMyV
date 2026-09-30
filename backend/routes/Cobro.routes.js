/** @format */

import express from "express";
import * as CobroController from "../controllers/Cobro.controller.js";

import { Cobro, Paciente, Turno } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import {
  createCobroSchema,
  updateCobroSchema,
} from "../schemas/Cobro.schema.js";

const router = express.Router();

// Rutas para Cobro
router.get(
  "/:id",
  validarExistencia(Turno, "id", "params"),
  CobroController.getCobroByTurnoId,
);

router.post(
  "/",
  validateSchema(createCobroSchema),
  validarExistencia(Turno, "id", "body"),
  validarExistencia(Paciente, "id", "body"),
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
