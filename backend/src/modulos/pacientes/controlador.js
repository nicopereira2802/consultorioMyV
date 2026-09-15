// ==============================================================================
// ARCHIVO: modulos/pacientes/controlador.js
// PROPÓSITO: Controlador del módulo de Pacientes (Lógica de Negocio y CRUD).
// Contiene las operaciones para listar, buscar, agregar, modificar y eliminar pacientes.
// ==============================================================================

// Conexión por defecto a la base de datos Neon PostgreSQL
const defaultDb = require('../../BD/neon');

// Nombre exacto de la tabla en la base de datos Neon PostgreSQL: 'PACIENTE'
const TABLA = 'paciente';

/**
 * Función constructora que recibe el módulo de base de datos a utilizar.
 * 
 * @param {Object} dbInyectada - Instancia de la base de datos (real o mock).
 * @returns {Object} - Métodos disponibles para gestionar pacientes.
 */
module.exports = function (dbInyectada) {
    let db = dbInyectada;

    // Si no se proporcionó una base de datos externa, usamos la conexión por defecto
    if (!db) {
        db = defaultDb;
    }

    /**
     * Obtiene la lista completa de todos los pacientes.
     */
    function todos() {
        return db.todos(TABLA);
    }

    /**
     * Obtiene los datos de un paciente específico a partir de su ID (id_paciente).
     * 
     * @param {number|string} id - Identificador del paciente.
     */
    function uno(id) {
        return db.uno(TABLA, id);
    }

    /**
     * Guarda los datos de un paciente:
     * - Si no incluye ID (o es 0), crea un nuevo paciente.
     * - Si incluye un ID existente, actualiza sus datos.
     * 
     * @param {Object} body - Datos del paciente (nombre, apellido, dni, telefono, etc.).
     */
    function agregar(body) {
        return db.agregar(TABLA, body);
    }

    /**
     * Elimina un paciente de la base de datos según su ID.
     * 
     * @param {Object|number} body - Objeto con el campo { id } o directamente el número de ID.
     */
    function eliminar(body) {
        return db.eliminar(TABLA, body);
    }

    // Exponemos las funciones públicas del controlador
    return {
        todos,
        uno,
        agregar,
        eliminar
    };
};