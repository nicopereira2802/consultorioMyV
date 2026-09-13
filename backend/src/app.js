const express = require('express');
const morgan = require('morgan');
const config = require('./config');

const pacientes = require('./modulos/pacientes/rutas');
const error = require('./red/errors');

const app = express();

//Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//configuracion
app.set('port', config.app.port);

//ruta para paciente
app.use('/api/pacientes', pacientes);
app.use(error);


module.exports = app;