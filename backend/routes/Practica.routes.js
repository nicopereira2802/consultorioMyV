import express from "express";
const router = express.Router();

import * as PracticaController from "../controllers/Practica.controller.js";

// Rutas para Practica
router.get("/", PracticaController.getAllPracticas);
router.get("/:id", PracticaController.getPracticaById);
router.post("/", PracticaController.createPractica);
router.put("/:id", PracticaController.updatePractica);
router.delete("/:id", PracticaController.deletePractica);

export default router;
