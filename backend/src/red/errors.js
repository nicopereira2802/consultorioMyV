// ==============================================================================
// ARCHIVO: errors.js
// PROPÓSITO: Middleware global para atrapar cualquier error que ocurra en el servidor.
// En Express, un "middleware" es una función intermedia que procesa peticiones.
// Cuando tiene 4 parámetros (err, req, res, next), Express sabe que es un manejador de errores.
// ==============================================================================

// Importamos nuestra función de respuestas estándar para enviar el error con formato ordenado.
const respuesta = require('./respuestas');

/**
 * Función manejadora de errores globales.
 * 
 * @param {Error} err - El objeto de error que fue arrojado en alguna ruta o consulta a la base de datos.
 * @param {Object} req - La petición HTTP original.
 * @param {Object} res - La respuesta HTTP con la que responderemos al cliente.
 * @param {Function} next - Función para pasar el control al siguiente middleware (si fuera necesario).
 */
function errors(err, req, res, next) {
    // Imprimimos el error completo en la consola del servidor para que el programador pueda revisarlo y depurarlo.
    console.error('[Error atrapado por middleware]:', err);

    // Si el error trae un mensaje descriptivo, lo usamos; si no, usamos un mensaje genérico.
    const message = err.message || 'Error interno del servidor';

    // Si el error trae un código HTTP (por ejemplo 404 o 400), lo usamos; de lo contrario usamos 500 (fallo del servidor).
    const status = err.statusCode || 500;

    // Enviamos la respuesta estructurada en formato JSON al cliente para evitar que la conexión se quede colgada.
    respuesta.error(req, res, message, status);
}

// Exportamos esta función para que pueda ser conectada en 'app.js' mediante 'app.use(error)'.
module.exports = errors;