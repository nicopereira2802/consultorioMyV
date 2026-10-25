/** @format */

import express from "express";
import * as GastoController from "../controllers/Gasto.controller.js";

import { Gasto } from "../models/index.model.js"; // Asegúrate de exportar Gasto en tu index de modelos
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { createGastoSchema, updateGastoSchema } from "../schemas/Gasto.schema.js";

const router = express.Router();

// Obtener todos los gastos (con paginación, búsqueda y filtros)
router.get("/", GastoController.getAllGastos);

// Obtener un gasto por su ID
router.get("/:id", validarExistencia(Gasto, "id", "params"), GastoController.getGastoById);

// Crear un nuevo gasto validado por esquema Zod
router.post("/", validateSchema(createGastoSchema), GastoController.createGasto);

// Actualizar un gasto existente
router.put(
  "/:id",
  validateSchema(updateGastoSchema),
  validarExistencia(Gasto, "id", "params"),
  GastoController.updateGasto,
);

// Baja lógica (toggle de activo) de un gasto
router.patch("/:id/delete", validarExistencia(Gasto, "id", "params"), GastoController.deleteGasto);

export default router;
