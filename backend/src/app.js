// ==============================================================================
// ARCHIVO: app.js
// PROPÓSITO: Configuración principal de la aplicación Express.
// Aquí se configuran los middlewares, se montan las rutas de los módulos
// y se registra la documentación Swagger.
// 
// NOTA IMPORTANTE DE ARQUITECTURA:
// Separamos 'app.js' de 'index.js' porque aquí configuramos la aplicación SIN
// levantar el servidor en ningún puerto (no hay 'app.listen'). Esto permite que
// herramientas de testing automático como Supertest o Jest puedan probar la API
// directamente en memoria sin ocupar puertos de red reales.
// ==============================================================================

// 'express' es el framework web más popular de Node.js. Facilita crear servidores,
// manejar rutas URL, peticiones HTTP (GET, POST, etc.) y respuestas JSON.
const express = require('express');

// 'morgan' es un logger (registrador): imprime en la consola cada petición que llega al servidor
// (método, ruta, código de estado y tiempo de respuesta).
const morgan = require('morgan');

// Configuración general del proyecto (puerto, URLs, etc.)
const config = require('./config');

// 'swagger-ui-express' permite servir una interfaz web visual e interactiva
// para ver y probar todos los endpoints documentados de la API.
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');

// Importamos los enrutadores de cada módulo
const pacientes = require('./modulos/pacientes/rutas');
const practicas = require('./modulos/practicas/rutas');

// Importamos el manejador central de errores
const error = require('./red/errors');

// Creamos la instancia principal de la aplicación Express
const app = express();

// ==============================================================================
// 1. DOCUMENTACIÓN SWAGGER (OPENAPI 3.0)
// ==============================================================================
// Monta la interfaz gráfica interactiva en http://localhost:3000/api-docs
// - 'swaggerUi.serve': sirve los archivos HTML, CSS y JS de Swagger UI.
// - 'swaggerUi.setup(...)': genera la interfaz usando el documento con la especificación de rutas.
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ==============================================================================
// 2. MIDDLEWARES (Funciones intermedias que procesan las peticiones entrantes)
// ==============================================================================

// 'morgan("dev")': Muestra en la terminal un resumen colorido de cada petición recibida
// Ejemplo: "GET /api/practicas 200 15ms"
app.use(morgan('dev'));

// 'express.json()': Interpreta los datos entrantes con formato JSON en el cuerpo (body) de la petición
// y los convierte en un objeto JavaScript accesible mediante 'req.body'.
app.use(express.json());

// 'express.urlencoded()': Permite interpretar datos enviados desde formularios tradicionales
app.use(express.urlencoded({ extended: true }));

// ==============================================================================
// 3. CONFIGURACIÓN GENERAL
// ==============================================================================
// Guarda el número de puerto dentro de la configuración de Express para consultarlo luego
app.set('port', config.app.port);

// ==============================================================================
// 4. RUTAS ESPECIALES Y DE MODULOS
// ==============================================================================

// Manejo preventivo para peticiones internas de Google Chrome DevTools:
// Cuando abres la consola del navegador, Chrome busca este archivo de configuración.
// Respondiendo 204 (No Content) evitamos advertencias molestas de 404 en la consola del navegador.
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(204).end();
});

// Rutas de Pacientes: todas las rutas definidas en 'modulos/pacientes/rutas.js'
// tendrán el prefijo '/api/pacientes' (ej: GET /api/pacientes, POST /api/pacientes)
app.use('/api/pacientes', pacientes);

// Rutas de Prácticas: todas las rutas de 'modulos/practicas/rutas.js'
// tendrán el prefijo '/api/practicas' (ej: GET /api/practicas, GET /api/practicas/:id)
app.use('/api/practicas', practicas);

// ==============================================================================
// 5. MANEJADOR GLOBAL DE ERRORES
// ==============================================================================
// Debe ir SIEMPRE al final de todas las rutas. Si alguna ruta arroja un error con 'next(err)',
// Express saltará directamente hasta este middleware para devolver una respuesta 500 ordenada.
app.use(error);

// Exportamos la aplicación para usarla en 'index.js' (servidor real) o en 'tests/' (pruebas)
module.exports = app;