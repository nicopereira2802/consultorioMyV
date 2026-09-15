// ==============================================================================
// ARCHIVO: test-db.js
// PROPÓSITO: Script de prueba rápida e independiente para la base de datos Neon.
// Utiliza únicamente el servidor HTTP nativo de Node.js (sin Express).
// 
// Puedes ejecutarlo en cualquier momento desde tu terminal con:
// npm run test-db
// ==============================================================================

// 1. Cargamos las variables de entorno desde el archivo .env (DATABASE_URL)
require("dotenv").config();

// 2. 'http' es el módulo estándar incluido de fábrica en Node.js para crear servidores web básicos
const http = require("http");

// 3. Importamos el cliente oficial de Neon para conectarnos a PostgreSQL
const { neon } = require("@neondatabase/serverless");

// 4. Inicializamos la conexión utilizando la URL almacenada en las variables de entorno
const sql = neon(process.env.DATABASE_URL);

/**
 * Función manejadora de peticiones (Request Handler).
 * Se ejecuta automáticamente cada vez que alguien visita http://localhost:3000
 */
const requestHandler = async (req, res) => {
  try {
    // Ejecuta la consulta SQL para obtener la versión del motor de PostgreSQL en Neon
    const result = await sql`SELECT version()`;

    // Extraemos el texto de la versión de la primera fila devuelta (result[0])
    const { version } = result[0];

    // Enviamos un encabezado HTTP 200 (OK) indicando que la respuesta es texto plano
    res.writeHead(200, { "Content-Type": "text/plain" });

    // Enviamos el texto y cerramos la conexión HTTP
    res.end(version);
  } catch (err) {
    // Si la conexión falla, respondemos con código HTTP 500 y el mensaje de error
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(`Error: ${err.message}`);
  }
};

// 5. Creamos el servidor HTTP con la función manejadora y lo ponemos a escuchar en el puerto 3000
http.createServer(requestHandler).listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
