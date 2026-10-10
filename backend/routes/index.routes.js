/** @format */

import express from "express";
const router = express.Router();

// Importar las rutas de los diferentes recursos
import CobroRoutes from "./Cobro.routes.js"
import CuotaRoutes from "./Cuota.routes.js"
import EstadoRoutes from "./EstadoTurno.routes.js"
import HistorialEstadoTurnoRoutes from "./HistorialEstadoTurno.routes.js";
import ObraSocialRoutes from "./ObraSocial.routes.js";
import PacienteRoutes from "./Paciente.routes.js";
import PacienteObraSocialRoutes from "./PacienteObraSocial.routes.js";
import PracticaRoutes from "./Practica.routes.js";
import PracticaTurnoRoutes from "./PracticaTurno.routes.js";
import TurnoRoutes from "./Turno.routes.js";

// Rutas para los diferentes recursos
router.use("/api/cobros", CobroRoutes);
router.use("/api/cuotas", CuotaRoutes);
router.use("/api/estados", EstadoRoutes);
router.use("/api/historial-estado-turnos", HistorialEstadoTurnoRoutes);
router.use("/api/obras-sociales", ObraSocialRoutes);
router.use("/api/pacientes", PacienteRoutes);
router.use("/api/pacientes-por-obras-sociales", PacienteObraSocialRoutes);
router.use("/api/practicas", PracticaRoutes);
router.use("/api/practicas-turnos", PracticaTurnoRoutes);
router.use("/api/turnos", TurnoRoutes);

export default router;
