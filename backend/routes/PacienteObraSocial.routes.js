import express from "express";
const router = express.Router();

import * as PacienteObraSocialController from "../controllers/PacienteObraSocial.controller.js";

// Rutas para Paciente por Obra Social
router.get("/", PacienteObraSocialController.getAllPacientesPorObraSocial);
router.get("/:id", PacienteObraSocialController.getPacientePorObraSocialById);
router.post("/", PacienteObraSocialController.createPacientePorObraSocial);
router.put("/:id", PacienteObraSocialController.updatePacientePorObraSocial);
router.delete("/:id", PacienteObraSocialController.deletePacientePorObraSocial);

export default router;
