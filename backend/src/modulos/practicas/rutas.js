// ==============================================================================
// ARCHIVO: modulos/practicas/rutas.js
// PROPÓSITO: Definición de las rutas HTTP (endpoints) para el módulo de prácticas.
// Aquí se mapea qué URL de internet ejecuta qué función de nuestro código.
// ==============================================================================

const express = require('express');

// Importamos el módulo de respuestas para devolver JSON estructurado
const respuesta = require('../../red/respuestas');

// Importamos el controlador (que ya tiene inyectada la conexión a la base de datos)
const controlador = require('./index');

// express.Router() es un mini-enrutador que agrupa rutas relacionadas bajo un mismo prefijo
const router = express.Router();

// ==============================================================================
// MAPEADO DE RUTAS
// Nota: como en 'app.js' montamos este archivo en '/api/practicas', las rutas aquí
// son relativas a ese prefijo.
// ==============================================================================

// Cuando alguien hace: GET http://localhost:3000/api/practicas
// se ejecuta la función 'todos'
router.get('/', todos);

// Cuando alguien hace: GET http://localhost:3000/api/practicas/123
// ':id' es un parámetro dinámico en la URL, que se ejecuta con la función 'uno'
router.get('/:id', uno);

// ==============================================================================
// CONTROLADORES DE RUTA (Funciones que atienden la petición)
// ==============================================================================

/**
 * Atiende la petición GET para obtener todas las prácticas.
 * 
 * @param {Object} req - Objeto de petición HTTP.
 * @param {Object} res - Objeto de respuesta HTTP.
 * @param {Function} next - Pasa el control al middleware de errores si algo falla.
 */
async function todos(req, res, next) {
    try {
        // 'await' espera de forma asíncrona a que la base de datos responda
        const items = await controlador.todos();

        // Si todo salió bien, enviamos la lista con código HTTP 200 (OK)
        respuesta.succes(req, res, items, 200);
    } catch (err) {
        // Si la base de datos o el código fallan, 'next(err)' le pasa el error
        // a nuestro middleware centralizado en 'src/red/errors.js'
        next(err);
    }
}

/**
 * Atiende la petición GET para obtener una sola práctica según su ID en la URL.
 */
async function uno(req, res, next) {
    try {
        // 'req.params.id' extrae el valor que el usuario escribió en la URL donde pusimos ':id'
        // Por ejemplo, en '/api/practicas/5', req.params.id vale '5'
        const items = await controlador.uno(req.params.id);

        // Devolvemos el resultado al cliente
        respuesta.succes(req, res, items, 200);
    } catch (err) {
        next(err);
    }
}

// Exportamos el enrutador para conectarlo en 'app.js'
module.exports = router;
