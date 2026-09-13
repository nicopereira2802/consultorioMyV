//Mensajes de respuestas para el acceso a las rutas
//OK
exports.succes = function (req, res, mensaje = '', status = 200){
    res.status(status).send({
        error: false,
        status:status,
        body: mensaje
    });
}

//Errores
exports.error = function (req, res, mensaje = 'Error interno', status = 500){
    res.status(status).send({
        error: true,
        status:status,
        body: mensaje
    });
}