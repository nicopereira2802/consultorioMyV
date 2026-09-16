import express from "express";
const router = express.Router();

import * as EstadoTurnoController from "../controllers/EstadoTurno.controller.js";

// Rutas para Estados de Turno
router.get("/", EstadoTurnoController.getAllEstadoTurnos);
router.get("/:id", EstadoTurnoController.getEstadoTurnoById);
//router.post("/", EstadoTurnoController.createEstadoTurno);
router.put("/:id", EstadoTurnoController.updateEstadoTurno);
//router.delete("/:id", EstadoTurnoController.deleteEstadoTurno);

export default router;
