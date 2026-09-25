import express from "express";
const router = express.Router();

import * as PracticaTurnoController from "../controllers/PracticaTurno.controller.js";
import { validateSchema } from "../middleware/validateSchema.js"
import { createPracticaTurnoSchema } from "../schemas/PracticaTurno.schema.js"

// Rutas para Practica por Turno
router.get("/", PracticaTurnoController.getAllPracticaTurno);
router.get("/:id", PracticaTurnoController.getPracticaTurnoById);
router.post("/", validateSchema(createPracticaTurnoSchema),PracticaTurnoController.createPracticaTurno);
router.put("/:id", PracticaTurnoController.updatePracticaTurno);
router.delete("/:id", PracticaTurnoController.deletePracticaTurno);

export default router;
