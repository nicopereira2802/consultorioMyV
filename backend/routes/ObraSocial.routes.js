import express from "express";
const router = express.Router();

import * as ObraSocialController from "../controllers/ObraSocial.controller.js";
import { validateSchema } from "../middleware/validateSchema.js"
import { createObraSocialSchema } from "../schemas/ObraSocial.schema.js"

// Rutas para Obra Social
router.get("/", ObraSocialController.getAllObrasSociales);
router.get("/:id", ObraSocialController.getObraSocialById);
router.post("/", validateSchema(createObraSocialSchema),ObraSocialController.createObraSocial);
router.put("/:id", ObraSocialController.updateObraSocial);
router.patch("/:id/delete", ObraSocialController.deleteObraSocial);

export default router;
