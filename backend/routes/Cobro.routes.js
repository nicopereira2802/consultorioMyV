/** @format */

import express from "express";
import * as CobroController from "../controllers/Cobro.controller.js";

import { Cobro, Paciente, Turno } from "../models/index.model.js";
import { validarExistencia } from "../middleware/validarExistenciaEntidad.js";

import { validateSchema } from "../middleware/validateSchema.js";
import { createCobroSchema, updateCobroSchema } from "../schemas/Cobro.schema.js";

const router = express.Router();

// ==========================================
// 1. RUTAS ESPECÍFICAS 
// ==========================================
router.get("/kpis", CobroController.getKpisCaja);
router.get("/pacientes/:id_paciente/balance", CobroController.getBalancePaciente);
router.get("/", CobroController.getAllCobros);

// ==========================================
// 2. CREACIÓN DE COBROS
// ==========================================
router.post(
  "/",
  validateSchema(createCobroSchema),
  validarExistencia(Turno, "id_turno", "body"),
  validarExistencia(Paciente, "id_paciente", "body"),
  CobroController.createCobro
);

router.post(
  "/pago",
  validarExistencia(Turno, "id_turno", "body"),
  CobroController.registrarPagoTurno
);

router.post(
  "/inmediato",
  validarExistencia(Turno, "id_turno", "body"),
  CobroController.createCobroInmediato
);

router.post(
  "/informal",
  validarExistencia(Turno, "id_turno", "body"),
  CobroController.createCobroInformal
);

// ==========================================
// 3. RUTAS PARAMETRIZADAS POR ID
// ==========================================
router.get("/:id", validarExistencia(Cobro, "id", "params"), CobroController.getCobroById);

router.put(
  "/:id",
  validateSchema(updateCobroSchema),
  validarExistencia(Cobro, "id", "params"),
  CobroController.updateCobro
);

router.patch("/:id/delete", validarExistencia(Cobro, "id", "params"), CobroController.deleteCobro);

export default router;