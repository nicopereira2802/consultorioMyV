import express from "express";
const router = express.Router();

// Importar las rutas de los diferentes recursos
import EstadoTurnoRoutes from "./EstadoTurno.routes.js";
import PacienteRoutes from "./Paciente.routes.js";
import ObraSocialRoutes from "./ObraSocial.routes.js";
import PacienteObraSocialRoutes from "./PacienteObraSocial.routes.js";
import PracticaTurnoRoutes from "./PracticaTurno.routes.js";
import TurnoRoutes from "./turno.routes.js";

// Rutas para los diferentes recursos
router.use("/api/estado-turnos", EstadoTurnoRoutes);
router.use("/api/pacientes", PacienteRoutes);
router.use("/api/obras-sociales", ObraSocialRoutes);
router.use("/api/pacientes-por-obras-sociales", PacienteObraSocialRoutes);
router.use("/api/practicas-turnos", PracticaTurnoRoutes);
router.use("/api/turnos", TurnoRoutes);

export default router;
