/** @format */

import express from "express";
import * as HistorialEstadoTurno from "../controllers/HistorialEstadoTurno.controller.js";

import { Turno } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

const router = express.Router();

// Rutas para HistorialEstadoTurno

router.get('/:id', HistorialEstadoTurno.getHistorialTurnoByTurnoId)

export default router;
