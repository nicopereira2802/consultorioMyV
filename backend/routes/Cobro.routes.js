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

// Obtener métricas consolidadas de caja (KPIs)
router.get("/kpis", CobroController.getKpisCaja);

// Balance de cuenta corriente por paciente (HU IE-3)
router.get("/pacientes/:id_paciente/balance", CobroController.getBalancePaciente);

// Listado general de cobros
router.get("/", CobroController.getAllCobros);

// ==========================================
// 2. CREACIÓN DE COBROS (Endpoints específicos)
// ==========================================

router.post(
  "/",
  validateSchema(createCobroSchema),
  validarExistencia(Turno, "id_turno", "body"),
  validarExistencia(Paciente, "id_paciente", "body"),
  CobroController.createCobro
);

router.post(
  "/inmediato",
  validarExistencia(Turno, "id_turno", "body"),
  validarExistencia(Paciente, "id_paciente", "body"),
  CobroController.createCobroInmediato
);

router.post(
  "/cuotas",
  validarExistencia(Turno, "id_turno", "body"),
  validarExistencia(Paciente, "id_paciente", "body"),
  CobroController.createCobroCuotas
);

router.post(
  "/informal",
  validarExistencia(Turno, "id_turno", "body"),
  validarExistencia(Paciente, "id_paciente", "body"),
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

// ==========================================
// 4. EXPORTACIÓN
// ==========================================
export default router;