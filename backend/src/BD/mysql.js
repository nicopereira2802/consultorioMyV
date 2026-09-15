// ==============================================================================
// ARCHIVO: mysql.js
// PROPÓSITO: Archivo de compatibilidad histórica (retrocompatibilidad).
// 
// Originalmente, el proyecto utilizaba una base de datos MySQL local.
// Posteriormente, se migró a Neon Serverless PostgreSQL.
// 
// Para evitar que el código antiguo se rompa si algún archivo todavía hace
// 'require("./BD/mysql")', este archivo simplemente reenvía todo hacia 'neon.js'.
// ==============================================================================

module.exports = require('./neon');