import express from "express";
const router = express.Router();

import * as TurnoController from "../controllers/Turno.controller.js";
import { validateSchema } from "../middleware/validateSchema.js"
import { createTurnoSchema } from "../schemas/Turno.schema.js"

// Rutas básicas de Turno
router.get("/", TurnoController.getAllTurnos);
router.get("/:id", TurnoController.getTurnoById);
router.post("/", validateSchema(createTurnoSchema),TurnoController.createTurno);          
router.delete("/:id", TurnoController.deleteTurno);

// Ver la línea de tiempo de los estados de un turno
router.get("/:id/historial", TurnoController.getHistorialTurno);

// Cambiar estado simple (Cancelar, Reprogramar)
router.patch("/:id/estado", TurnoController.cambiarEstadoTurno);

// Finalizar atención en consultorio y registrar prácticas 
router.post("/:id/atencion", TurnoController.atenderTurno);

export default router;