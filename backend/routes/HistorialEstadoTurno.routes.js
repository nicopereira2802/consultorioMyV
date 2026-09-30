/** @format */

import express from "express";
import * as HistorialEstadoTurno from "../controllers/HistorialEstadoTurno.controller.js";

import { Turno } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

const router = express.Router();

// Rutas para HistorialEstadoTurno

/* Ejemplos de uso:
 * Historial más reciente: GET /api/historial-turnos/turno/12
 * Cronológico: GET /api/historial-turnos/turno/12?sortOrder=ASC
 */

router.get('/:id', HistorialEstadoTurno.getHistorialTurnoByTurnoId)

export default router;
