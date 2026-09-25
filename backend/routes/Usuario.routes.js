import express from "express";
const router = express.Router();

import * as UsuarioController from "../controllers/Usuario.controller";
import { validateSchema } from "../middleware/validateSchema.js";
import { createUsuarioSchema } from "../schemas/Usuario.schema.js";

// Rutas basicas usuario

router.post("/usuario/login")
router.post("/usuario/")