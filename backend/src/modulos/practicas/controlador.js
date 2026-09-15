// ==============================================================================
// ARCHIVO: modulos/practicas/controlador.js
// PROPÓSITO: Controlador del módulo de Prácticas (Lógica de Negocio).
// En la arquitectura MVC (Modelo-Vista-Controlador), el Controlador es el intermediario
// que sabe qué datos pedirle a la base de datos cuando alguien hace una petición.
// ==============================================================================

// Base de datos por defecto (Neon PostgreSQL) en caso de que no se inyecte ninguna
const defaultDb = require('../../BD/neon');

// Nombre exacto de la tabla en la base de datos Neon PostgreSQL: 'PRACTICA'
const TABLA = 'practica';

/**
 * Función constructora que recibe la base de datos como parámetro (Inyección de dependencias).
 * 
 * @param {Object} dbInyectada - Módulo de base de datos a utilizar (real o simulado/mock).
 * @returns {Object} - Objeto con las funciones disponibles para consultar prácticas.
 */
module.exports = function (dbInyectada) {
    let db = dbInyectada;

    // Si por alguna razón no se proporcionó una base de datos, usamos la conexión por defecto
    if (!db) {
        db = defaultDb;
    }

    /**
     * Consulta y devuelve la lista de todas las prácticas registradas.
     * Corresponde a la operación HTTP GET /api/practicas
     * 
     * @returns {Promise<Array>} - Lista de objetos de prácticas.
     */
    function todos() {
        return db.todos(TABLA);
    }

    /**
     * Consulta y devuelve los datos de una sola práctica buscando por su identificador.
     * Corresponde a la operación HTTP GET /api/practicas/:id
     * 
     * @param {number|string} id - El id de la práctica a buscar (id_practica).
     * @returns {Promise<Array>} - Array con la práctica encontrada.
     */
    function uno(id) {
        return db.uno(TABLA, id);
    }

    // Retornamos únicamente los métodos públicos disponibles para este módulo (solo GET)
    return {
        todos,
        uno
    };
};
