/** @format */

import express from "express";
import * as PracticaController from "../controllers/Practica.controller.js";

import { Practica } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import {
  createPracticaSchema,
  updatePracticaSchema,
} from "../schemas/Practica.schema.js";

const router = express.Router();

// Rutas para Practica
router.get("/", PracticaController.getAllPracticas);

router.get(
  "/:id",
  validarExistencia(Practica, "id", "params"),
  PracticaController.getPracticaById,
);

router.post(
  "/",
  validateSchema(createPracticaSchema),
  PracticaController.createPractica,
);

router.put(
  "/:id",
  validateSchema(updatePracticaSchema),
  validarExistencia(Practica, "id", "params"),
  PracticaController.updatePractica,
);

router.patch(
  "/:id/delete",
  validarExistencia(Practica, "id", "params"),
  PracticaController.deletePractica,
);

export default router;
