/** @format */

import express from "express";
import * as CuotaController from "../controllers/Cuota.controller.js";

import { Cobro, Cuota } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import {
  createCuotaSchema,
  updateCuotaSchema,
} from "../schemas/Cuota.schema.js";

const router = express.Router();

// Rutas para Cuota
router.get(
  "/:cobroId/cuotas",
  validarExistencia(Cobro, "cobroId", "params"),
  CuotaController.getCuotaByCobroId,
);

router.get(
  "/:id",
  validarExistencia(Cuota, "id", "params"),
  CuotaController.getCuotaById,
);

router.post(
  "/",
  validateSchema(createCuotaSchema),
  validarExistencia(Cobro, "id_cobro", "body"),
  CuotaController.createCuota,
);

router.put(
  "/:id",
  validateSchema(updateCuotaSchema),
  validarExistencia(Cuota, "id", "params"),
  CuotaController.updateCuota,
);

router.patch(
  "/:id/cobrar",
  validateSchema(updateCuotaSchema),
  validarExistencia(Cuota, "id", "params"),
  CuotaController.cobrarCuota,
);

router.patch(
  "/:id/delete",
  validarExistencia(Cuota, "id", "params"),
  CuotaController.deleteCuota,
);
export default router;
