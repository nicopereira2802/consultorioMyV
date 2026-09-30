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

/* Ejemplo de uso:
 * -> Tabla basica (pag 1):     GET /api/pacientes?page=1&limit=10
 * -> Buscador en tiempo real:     GET /api/pacientes?search=38123456
 * -> Buscador por nombre:         GET /api/pacientes?search=perez
 * -> Ordenar por DNI descendente: GET /api/pacientes?sortField=dni&sortOrder=DESC
 * -> Paginación combinada:        GET /api/pacientes?search=juan&page=2&limit=5&sortField=nombre&sortOrder=ASC
 */
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
