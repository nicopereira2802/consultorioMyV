/** @format */

import express from "express";
import * as EstadoTurnoController from "../controllers/EstadoTurno.controller.js";
import e from "express";

const router = express.Router();

// Rutas para EstadoTurno
router.get("/", EstadoTurnoController.getAllEstados);

export default router;
