// ==============================================================================
// ARCHIVO: config.js
// PROPÓSITO: Configuración centralizada de variables de entorno para la aplicación.
// ==============================================================================

// 'dotenv' es una librería que lee un archivo de texto llamado '.env' en la raíz del proyecto.
// Dentro de '.env' guardamos datos confidenciales (como contraseñas o URLs de bases de datos).
// Al llamar a .config(), esos datos se cargan automáticamente en 'process.env'.
require('dotenv').config();

// 'module.exports' es la forma en que Node.js comparte variables, funciones u objetos
// con otros archivos del proyecto (sistema de módulos CommonJS).
module.exports = {
    // Configuración general del servidor
    app: {
        // Puerto de red donde escuchará el servidor (por ejemplo: 3000).
        // 'process.env.PORT || 3000' significa: "si existe una variable PORT en el archivo .env,
        // úsala; si no está definida, usa el puerto 3000 por defecto".
        port: process.env.PORT || 3000,
    },
    // Cadena de conexión secreta hacia la base de datos Neon PostgreSQL.
    // Viene desde la variable DATABASE_URL del archivo .env.
    databaseUrl: process.env.DATABASE_URL
};