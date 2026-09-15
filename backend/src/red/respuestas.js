// ==============================================================================
// ARCHIVO: respuestas.js
// PROPÓSITO: Estandarizar el formato de las respuestas que enviamos al usuario/cliente.
// Así, el frontend siempre recibe la misma estructura JSON tanto si todo sale bien
// como si ocurre un error.
// ==============================================================================

/**
 * Función para responder cuando una operación fue EXITOSA.
 * 
 * @param {Object} req - Objeto 'request': representa la petición HTTP que llegó del cliente.
 * @param {Object} res - Objeto 'response': herramienta de Express para enviar la respuesta de vuelta al cliente.
 * @param {*} mensaje - Los datos o mensaje que queremos devolver (ej: la lista de pacientes o un texto).
 * @param {number} status - Código de estado HTTP (200 = OK por defecto, 201 = Creado, etc.).
 */
exports.succes = function (req, res, mensaje = '', status = 200) {
    // res.status(...) define el código HTTP numérico de la respuesta.
    // res.send(...) envía los datos en formato JSON hacia quien hizo la petición.
    res.status(status).send({
        error: false,      // Indica que NO hubo ningún fallo
        status: status,    // El número de código HTTP (ej: 200)
        body: mensaje      // Los datos útiles resultantes de la operación
    });
};

/**
 * Función para responder cuando ocurrió un ERROR.
 * 
 * @param {Object} req - Objeto 'request'.
 * @param {Object} res - Objeto 'response'.
 * @param {*} mensaje - Descripción del error (por defecto 'Error interno').
 * @param {number} status - Código de estado HTTP de error (500 = Error del servidor por defecto, 404 = No encontrado, etc.).
 */
exports.error = function (req, res, mensaje = 'Error interno', status = 500) {
    res.status(status).send({
        error: true,       // Indica que SÍ ocurrió un problema
        status: status,    // El número de código HTTP (ej: 500 o 404)
        body: mensaje      // El texto explicativo del error
    });
};