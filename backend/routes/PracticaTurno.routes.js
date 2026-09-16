import express from "express";
const router = express.Router();

import * as PracticaTurnoController from "../controllers/PracticaTurno.controller.js";

// Rutas para Practica por Turno
router.get("/", PracticaTurnoController.getAllPracticaTurno);
router.get("/:id", PracticaTurnoController.getPracticaTurnoById);
router.post("/", PracticaTurnoController.createPracticaTurno);
router.put("/:id", PracticaTurnoController.updatePracticaTurno);
router.delete("/:id", PracticaTurnoController.deletePracticaTurno);

export default router;
