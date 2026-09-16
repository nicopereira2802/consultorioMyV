import express from "express";
const router = express.Router();

import * as ObraSocialController from "../controllers/ObraSocial.controller.js";

// Rutas para Obra Social
router.get("/", ObraSocialController.getAllObrasSociales);
router.get("/:id", ObraSocialController.getObraSocialById);
router.post("/", ObraSocialController.createObraSocial);
router.put("/:id", ObraSocialController.updateObraSocial);
router.delete("/:id", ObraSocialController.deleteObraSocial);

export default router;
