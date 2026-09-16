import express from "express";
const router = express.Router();

import * as TurnoController from "../controllers/Turno.controller.js";

// Rutas para Turno
router.get("/", TurnoController.getAllTurnos);
router.get("/:id", TurnoController.getTurnoById);
router.post("/", TurnoController.createTurno);
router.put("/:id", TurnoController.updateTurno);
router.delete("/:id", TurnoController.deleteTurno);

export default router;
