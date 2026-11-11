/** @format */

import express from "express";
import * as RestriccionController from "../controllers/Restriccion.controller.js";

const router = express.Router();

router.get("/", RestriccionController.getAllRestricciones);
router.post("/", RestriccionController.createRestriccion);
router.delete("/:id", RestriccionController.deleteRestriccion);

export default router;