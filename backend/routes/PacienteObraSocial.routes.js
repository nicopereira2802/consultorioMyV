import express from "express";
const router = express.Router();

import * as PacienteObraSocialController from "../controllers/PacienteObraSocial.controller.js";
import { validateSchema } from "../middleware/validateSchema.js"
import { createPacienteObraSocialSchema } from "../schemas/PacienteObraSocial.schema.js"

// Rutas para Paciente por Obra Social
router.get("/", PacienteObraSocialController.getAllPacientesPorObraSocial);
router.get("/:id", PacienteObraSocialController.getPacientePorObraSocialById);
router.post("/", validateSchema(createPacienteObraSocialSchema),PacienteObraSocialController.createPacientePorObraSocial);
router.put("/:id", PacienteObraSocialController.updatePacientePorObraSocial);
router.delete("/:id", PacienteObraSocialController.deletePacientePorObraSocial);

export default router;
