// ==============================================================================
// ARCHIVO: modulos/pacientes/rutas.js
// PROPÓSITO: Endpoints HTTP para la gestión de pacientes.
// Define qué rutas aceptan peticiones GET, POST y PUT para interactuar con pacientes.
// ==============================================================================

const express = require('express');

// Módulo para responder con formato JSON estándar
const respuesta = require('../../red/respuestas');

// Controlador de pacientes con la lógica de negocio y acceso a datos
const controlador = require('./index');

// Enrutador de Express para agrupar las rutas del módulo
const router = express.Router();

// ==============================================================================
// DEFINICIÓN DE RUTAS (Prefijo base en app.js: /api/pacientes)
// ==============================================================================

// GET http://localhost:3000/api/pacientes -> Lista todos los pacientes
router.get('/', todos);

// GET http://localhost:3000/api/pacientes/:id -> Obtiene un paciente por su ID
router.get('/:id', uno);

// POST http://localhost:3000/api/pacientes -> Crea o actualiza un paciente enviando datos en el body
router.post('/', agregar);

// PUT http://localhost:3000/api/pacientes -> Elimina un paciente enviando { id } en el body
router.put('/', eliminar);

// ==============================================================================
// FUNCIONES MANEJADORAS DE CADA RUTA
// ==============================================================================

/**
 * Consulta la lista completa de pacientes en la base de datos.
 */
async function todos(req, res, next) {
    try {
        const items = await controlador.todos();
        respuesta.succes(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

/**
 * Consulta un solo paciente buscando por su ID en los parámetros de la URL (req.params.id).
 */
async function uno(req, res, next) {
    try {
        const items = await controlador.uno(req.params.id);
        respuesta.succes(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

/**
 * Recibe los datos de un paciente en el cuerpo de la petición (req.body) en formato JSON.
 * - Si no tiene ID o es 0: guarda un nuevo paciente.
 * - Si tiene ID: actualiza el paciente existente.
 */
async function agregar(req, res, next) {
    try {
        await controlador.agregar(req.body);
        let mensaje;
        if (!req.body.id || req.body.id == 0) {
            mensaje = 'Item guardado con exito';
        } else {
            mensaje = 'Item actualizado con exito';
        }
        // Respondemos con código HTTP 201 (Created: recurso creado o procesado)
        respuesta.succes(req, res, mensaje, 201);
    } catch (err) {
        next(err);
    }
}

/**
 * Recibe el ID del paciente a borrar dentro del cuerpo de la petición (req.body).
 */
async function eliminar(req, res, next) {
    try {
        await controlador.eliminar(req.body);
        respuesta.succes(req, res, 'item eliminado de forma correcta', 200);
    } catch (err) {
        next(err);
    }
}

// Exportamos el router para montarlo en app.js
module.exports = router;