/** @format */

import express from "express";
import * as CategoriaGastoController from "../controllers/CategoriaGasto.controller.js";

import { CategoriaGasto } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";
import { validateSchema } from "../middleware/validateSchema.js";
import { createCategoriaGastoSchema, updateCategoriaGastoSchema } from "../schemas/CategoriaGasto.schema.js";

const router = express.Router();

router.get("/", CategoriaGastoController.getAllCategoriasGastos);

router.get(
  "/:id",
  validarExistencia(CategoriaGasto, "id", "params"),
  CategoriaGastoController.getCategoriaGastoById,
);

router.post("/", validateSchema(createCategoriaGastoSchema), CategoriaGastoController.createCategoriaGasto);

router.put(
  "/:id",
  validateSchema(updateCategoriaGastoSchema),
  validarExistencia(CategoriaGasto, "id", "params"),
  CategoriaGastoController.updateCategoriaGasto,
);

router.patch(
  "/:id/delete",
  validarExistencia(CategoriaGasto, "id", "params"),
  CategoriaGastoController.deleteCategoriaGasto,
);

export default router;
