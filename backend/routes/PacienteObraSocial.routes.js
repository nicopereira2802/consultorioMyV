/** @format */

import express from "express";
import * as PacienteObraSocialController from "../controllers/PacienteObraSocial.controller.js";

import {
  PacienteObraSocial,
  Paciente,
  ObraSocial,
} from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import {
  createPacienteObraSocialSchema,
  updatePacienteObraSocialSchema,
} from "../schemas/PacienteObraSocial.schema.js";
const router = express.Router();

// Rutas para Paciente por Obra Social
router.get("/", PacienteObraSocialController.getAllPacientesPorObraSocial);

router.get(
  "/:id",
  validarExistencia(PacienteObraSocial, "id", "params"),
  PacienteObraSocialController.getPacientePorObraSocialById,
);
router.post(
  "/",
  validateSchema(createPacienteObraSocialSchema),
  validarExistencia(Paciente, "id_paciente", "body"),
  validarExistencia(ObraSocial, "id_obra_social", "body"),
  PacienteObraSocialController.createPacientePorObraSocial,
);

router.put(
  "/:id",
  validateSchema(updatePacienteObraSocialSchema),
  validarExistencia(PacienteObraSocial, "id", "params"),
  validarExistencia(Paciente, "id_paciente", "body"),
  validarExistencia(ObraSocial, "id_obra_social", "body"),
  PacienteObraSocialController.updatePacientePorObraSocial,
);

router.delete(
  "/:id",
  validarExistencia(PacienteObraSocial, "id", "params"),
  PacienteObraSocialController.deletePacientePorObraSocial,
);

export default router;
