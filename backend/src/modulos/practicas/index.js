// ==============================================================================
// ARCHIVO: modulos/practicas/index.js
// PROPÓSITO: Punto de entrada del módulo de prácticas.
// Aplica el patrón de diseño "Inyección de Dependencias" (Dependency Injection).
// ==============================================================================

// 1. Importamos la conexión real a la base de datos (Neon PostgreSQL)
const db = require('../../BD/neon');

// 2. Importamos la función constructora del controlador
const ctrl = require('./controlador');

// 3. Le "inyectamos" la base de datos al controlador al invocarlo: ctrl(db).
// ¿Por qué se hace esto?
// Esto permite que el controlador no dependa rígidamente de una sola base de datos.
// En producción le pasamos la base de datos real 'db', pero en pruebas automáticas (tests)
// podemos pasarle una base de datos falsa (Mock) sin modificar el controlador.
module.exports = ctrl(db);
