import express from "express";
const router = express.Router();

import * as PacienteController from "../controllers/Paciente.controller.js";
import { validateSchema } from "../middleware/validateSchema.js"
import { createPacienteSchema } from "../schemas/Paciente.schema.js"

// Rutas para Paciente
router.get("/", PacienteController.getAllPacientes);
router.get("/:id", PacienteController.getPacienteById);
router.post("/", validateSchema(createPacienteSchema),PacienteController.createPaciente);
router.put("/:id", PacienteController.updatePaciente);
router.delete("/:id", PacienteController.deletePaciente);

export default router;
