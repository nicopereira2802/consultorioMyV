import express from "express";
const router = express.Router();

import * as PracticaController from "../controllers/Practica.controller.js";
import { validateSchema } from "../middleware/validateSchema.js"
import { createPracticaSchema } from "../schemas/Practica.schema.js"

// Rutas para Practica
router.get("/", PracticaController.getAllPracticas);
router.get("/:id", PracticaController.getPracticaById);
router.post("/", validateSchema(createPracticaSchema),PracticaController.createPractica);
router.put("/:id", PracticaController.updatePractica);
router.patch("/:id/delete", PracticaController.deletePractica);

export default router;
