/** @format */

import express from "express";
import * as ObraSocialController from "../controllers/ObraSocial.controller.js";

import { ObraSocial } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import {
  createObraSocialSchema,
  updateObraSocialSchema,
} from "../schemas/ObraSocial.schema.js";

const router = express.Router();

// Rutas para Obra Social
router.get("/", ObraSocialController.getAllObrasSociales);

router.get(
  "/:id",
  validarExistencia(ObraSocial, "id", "params"),
  ObraSocialController.getObraSocialById,
);

router.post(
  "/",
  validateSchema(createObraSocialSchema),
  ObraSocialController.createObraSocial,
);

router.put(
  "/:id",
  validateSchema(updateObraSocialSchema),
  validarExistencia(ObraSocial, "id", "params"),
  ObraSocialController.updateObraSocial,
);

router.patch(
  "/:id/delete",
  validarExistencia(ObraSocial, "id", "params"),
  ObraSocialController.deleteObraSocial,
);

export default router;
