/** @format */

import express from "express";
import * as CajaController from "../controllers/Caja.controller.js";

const router = express.Router();

// Ruta unificada para caja: GET /api/caja
router.get("/", CajaController.getCajaConsolidada);

export default router;
