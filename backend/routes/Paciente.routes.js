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
//este get tiene implementado el filtrado y paginacion
router.get("/", PacienteController.getAllPacientes);

router.get(
  "/:id",
  validarExistencia(Paciente, "id", "params"),
  PacienteController.getPacienteById,
);

router.get(
  "/:id/historial",
  validarExistencia(Paciente, "id", "params"),
  PacienteController.getHistorialPaciente,
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

router.delete(
  "/:id",
  validarExistencia(Paciente, "id", "params"),
  PacienteController.deletePaciente,
);

router.patch(
  "/:id/delete",
  validarExistencia(Paciente, "id", "params"),
  PacienteController.deletePaciente,
);

router.put(
  "/:id/reactivar",
  PacienteController.reactivarPaciente,
);

router.patch(
  "/:id/reactivar",
  PacienteController.reactivarPaciente,
);

router.post(
  "/:id/reactivar",
  PacienteController.reactivarPaciente,
);

export default router;
