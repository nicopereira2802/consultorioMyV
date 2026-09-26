/** @format */

import express from "express";
import * as PacienteController from "../controllers/Paciente.controller.js";

import { Paciente } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import {
  createPacienteSchema,
  updatePacienteSchema,
} from "../schemas/Paciente.schema.js";

const router = express.Router();

// Rutas para Paciente
router.get("/", PacienteController.getAllPacientes);

router.get(
  "/:id",
  validarExistencia(Paciente, "id", "params"),
  PacienteController.getPacienteById,
);

router.post(
  "/",
  validateSchema(createPacienteSchema),
  PacienteController.createPaciente,
);

router.put(
  "/:id",
  validateSchema(updatePacienteSchema),
  validarExistencia(Paciente, "id", "params"),
  PacienteController.updatePaciente,
);

router.patch(
  "/:id/delete",
  validarExistencia(Paciente, "id", "params"),
  PacienteController.deletePaciente,
);

export default router;
