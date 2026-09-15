// ==============================================================================
// ARCHIVO: index.js
// PROPÓSITO: Punto de entrada (Entry Point) para arrancar el servidor en vivo.
// Este es el archivo que se ejecuta cuando corres 'npm run dev' o 'npm start'.
// ==============================================================================

// Importamos la aplicación Express ya configurada desde 'app.js'
const app = require('./app');

// Importamos el módulo de base de datos para consultar la versión de Neon PostgreSQL
const db = require('./BD/neon');

// ==============================================================================
// RUTA RAÍZ (GET /) - PRUEBA DE CONEXIÓN A LA BASE DE DATOS
// ==============================================================================
// Cuando abres http://localhost:3000/ en el navegador:
// Ejecuta 'SELECT version()' en Neon y devuelve la versión de PostgreSQL en texto plano.
app.get('/', async (req, res) => {
    try {
        // Consultamos la versión de PostgreSQL instalada en Neon
        const version = await db.version();

        // 'res.writeHead' configura el código de respuesta (200 OK) y el tipo de contenido (texto plano)
        res.writeHead(200, { 'Content-Type': 'text/plain' });

        // 'res.end' finaliza la respuesta enviando el texto de la versión
        res.end(version);
    } catch (error) {
        // Si no hay internet o DATABASE_URL está mal configurada, informamos el error de forma clara
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(`Servidor Express activo. Error conectando con Neon DB: ${error.message}`);
    }
});

// ==============================================================================
// INICIALIZACIÓN DEL SERVIDOR EN EL PUERTO DE RED
// ==============================================================================
// 'app.listen' pone al servidor en modo de escucha activa en el puerto configurado (ej: 3000).
// A partir de este momento, el servidor puede recibir peticiones HTTP desde navegadores o apps.
app.listen(app.get('port'), () => {
    console.log(`Servidor corriendo en http://localhost:${app.get('port')}`);
    console.log(`Documentación Swagger disponible en http://localhost:${app.get('port')}/api-docs`);
});