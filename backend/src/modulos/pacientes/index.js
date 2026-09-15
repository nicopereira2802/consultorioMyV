// ==============================================================================
// ARCHIVO: modulos/pacientes/index.js
// PROPÓSITO: Punto de entrada del módulo de pacientes.
// Aplica el patrón de diseño "Inyección de Dependencias" (Dependency Injection).
// ==============================================================================

// 1. Importamos la conexión real a la base de datos Neon PostgreSQL
const db = require('../../BD/neon');

// 2. Importamos la función constructora del controlador de pacientes
const ctrl = require('./controlador');

// 3. Le inyectamos la base de datos al controlador al invocarlo: ctrl(db).
// Esto desacopla el controlador para que sea fácil de probar de forma aislada.
module.exports = ctrl(db);