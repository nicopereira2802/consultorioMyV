// ==============================================================================
// ARCHIVO: neon.js
// PROPÓSITO: Conexión y operaciones de base de datos con Neon Serverless PostgreSQL.
// Este archivo encapsula todas las consultas SQL (SELECT, INSERT, UPDATE, DELETE)
// para que el resto del código no tenga que escribir SQL directamente.
// ==============================================================================

// Carga las variables del archivo .env (DATABASE_URL)
require('dotenv').config();

// '@neondatabase/serverless' es la librería oficial de Neon para conectarse a PostgreSQL
// mediante peticiones HTTP/WebSockets seguras y ultra rápidas.
const { neon } = require('@neondatabase/serverless');

// Importamos la configuración donde reside la variable DATABASE_URL
const config = require('../config');

// Obtenemos la URL de la base de datos desde config o directamente del entorno
const databaseUrl = config.databaseUrl || process.env.DATABASE_URL;

// Variable interna para almacenar el cliente de conexión SQL
let sql = null;

/**
 * Obtiene o inicializa el cliente SQL de Neon.
 * Si aún no fue creado, lo inicializa usando la DATABASE_URL.
 * Si falta la variable, arroja un error claro para el desarrollador.
 */
function getSql() {
    if (!sql) {
        const url = config.databaseUrl || process.env.DATABASE_URL;
        if (!url) {
            throw new Error('DATABASE_URL no está configurada. Define DATABASE_URL en tu archivo .env');
        }
        sql = neon(url);
    }
    return sql;
}

// Inicialización preventiva si la URL ya está disponible al arrancar el servidor
if (databaseUrl) {
    try {
        sql = neon(databaseUrl);
    } catch (err) {
        console.error('[BD error al inicializar Neon]:', err);
    }
}

// ==============================================================================
// MEMORIA CACHÉ LOCAL
// Guardamos los nombres reales de las tablas y sus claves primarias en estos objetos
// para no tener que preguntarle a PostgreSQL la estructura en cada petición.
// ==============================================================================
const tableCache = {};
const pkCache = {};

/**
 * Resuelve el nombre real de la tabla en la base de datos.
 * Ejemplo: si el código pide 'practicas' pero en la BD la tabla se llama 'practica' (singular),
 * esta función detecta que existe 'practica' y la usa automáticamente.
 * 
 * @param {Function} client - El cliente de consulta de Neon.
 * @param {string} tabla - Nombre de la tabla solicitada (ej: 'pacientes' o 'practicas').
 * @returns {Promise<string>} - Nombre real existente en la base de datos (ej: 'paciente' o 'practica').
 */
async function resolverTabla(client, tabla) {
    // Si ya consultamos esta tabla antes, la devolvemos directamente de la memoria caché
    if (tableCache[tabla]) return tableCache[tabla];

    try {
        // Consultamos la tabla del sistema de PostgreSQL ('information_schema.tables') para verificar si existe
        const check = await client.query(
            "SELECT table_name FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public'",
            [tabla]
        );

        if (check.length > 0) {
            tableCache[tabla] = tabla;
            return tabla;
        }

        // Si termina en 's' (plural en español), probamos quitándole la 's' final (ej: 'practicas' -> 'practica')
        if (tabla.endsWith('s')) {
            const singular = tabla.slice(0, -1);
            const checkSingular = await client.query(
                "SELECT table_name FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public'",
                [singular]
            );
            if (checkSingular.length > 0) {
                tableCache[tabla] = singular;
                return singular;
            }
        }
    } catch {
        // En caso de que falle la consulta al esquema, usamos el nombre recibido
    }

    tableCache[tabla] = tabla;
    return tabla;
}

/**
 * Detecta automáticamente cuál es el nombre de la columna identificadora (clave primaria / PK).
 * Ejemplo: en la tabla 'practica' la columna es 'id_practica', en 'paciente' es 'id_paciente'.
 * 
 * @param {Function} client - Cliente de Neon.
 * @param {string} tabla - Nombre real de la tabla en la BD.
 * @returns {Promise<string>} - Nombre de la columna clave primaria (ej: 'id_practica').
 */
async function getPkColumn(client, tabla) {
    // Si ya la conocemos en caché, la devolvemos de inmediato
    if (pkCache[tabla]) return pkCache[tabla];

    try {
        // Consultamos las columnas de esta tabla en PostgreSQL
        const cols = await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = $1",
            [tabla]
        );
        const colNames = cols.map(c => c.column_name);

        let pk = 'id';
        // Buscamos si existe 'id_nombredetabla' (ej: id_practica o id_paciente)
        if (colNames.includes(`id_${tabla}`)) {
            pk = `id_${tabla}`;
        } else if (colNames.includes('id')) {
            pk = 'id';
        } else {
            // Si no, buscamos cualquier columna que empiece por 'id'
            const anyId = colNames.find(c => c.startsWith('id'));
            pk = anyId || colNames[0] || 'id';
        }

        pkCache[tabla] = pk;
        return pk;
    } catch {
        // Valor de contingencia por defecto
        return `id_${tabla}`;
    }
}

// ==============================================================================
// FUNCIONES CRUD EXPORTADAS (Create, Read, Update, Delete)
// ==============================================================================

/**
 * Consulta la versión de PostgreSQL que está ejecutándose en Neon.
 * Útil como prueba de salud (healthcheck) de la conexión a la base de datos.
 */
async function version() {
    const client = getSql();
    // Ejecuta la consulta nativa de Postgres: SELECT version()
    const result = await client`SELECT version()`;
    return result[0]?.version;
}

/**
 * Retorna todos los registros contenidos en una tabla.
 * Equivale a un: SELECT * FROM tabla
 * 
 * @param {string} tabla - Nombre de la tabla a consultar (ej: 'practica').
 * @returns {Promise<Array>} - Lista de objetos donde cada objeto es una fila de la tabla.
 */
async function todos(tabla) {
    const client = getSql();
    const realTable = await resolverTabla(client, tabla);
    return await client.query(`SELECT * FROM ${realTable}`);
}

/**
 * Retorna un único registro buscando por su identificador numérico (ID).
 * Equivale a: SELECT * FROM tabla WHERE columna_id = id
 * 
 * Usamos consultas parametrizadas ($1) para evitar ataques de inyección SQL.
 * 
 * @param {string} tabla - Nombre de la tabla.
 * @param {number|string} id - El identificador buscado.
 * @returns {Promise<Array>} - Array con el registro encontrado (o vacío si no existe).
 */
async function uno(tabla, id) {
    const client = getSql();
    const realTable = await resolverTabla(client, tabla);
    const pk = await getPkColumn(client, realTable);
    return await client.query(`SELECT * FROM ${realTable} WHERE ${pk} = $1`, [id]);
}

/**
 * Inserta un nuevo registro en la base de datos.
 * Genera dinámicamente las columnas y marcadores de posición ($1, $2, $3...) según las propiedades del objeto 'data'.
 * 
 * @param {string} tabla - Tabla donde insertar.
 * @param {Object} data - Objeto con los campos a guardar (ej: { nombre: 'Juan', dni: '123' }).
 * @returns {Promise<Array>} - Registro recién insertado devuelto por 'RETURNING *'.
 */
async function insertar(tabla, data) {
    const client = getSql();
    const realTable = await resolverTabla(client, tabla);

    const keys = Object.keys(data);       // Nombres de las columnas (ej: ['nombre', 'dni'])
    const values = Object.values(data);   // Valores correspondientes (ej: ['Juan', '123'])
    const columns = keys.join(', ');      // Cadena: "nombre, dni"
    
    // Crea los marcadores de posición para Postgres: "$1, $2, ..."
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${realTable} (${columns}) VALUES (${placeholders}) RETURNING *`;
    return await client.query(query, values);
}

/**
 * Actualiza los datos de un registro existente identificado por su ID.
 * Genera la cláusula SET dinámicamente: "col1 = $1, col2 = $2 WHERE id = $3"
 * 
 * @param {string} tabla - Tabla a actualizar.
 * @param {Object} data - Objeto con los datos modificados y su identificador.
 * @returns {Promise<Array>} - Registro actualizado devuelto por 'RETURNING *'.
 */
async function actualizar(tabla, data) {
    const client = getSql();
    const realTable = await resolverTabla(client, tabla);
    const pk = await getPkColumn(client, realTable);

    // Extraemos el ID del objeto
    const id = data[pk] || data.id;

    // Copiamos los campos excepto el ID (el ID no debe cambiarse)
    const campos = { ...data };
    delete campos[pk];
    delete campos.id;

    const keys = Object.keys(campos);
    const values = Object.values(campos);

    // Creamos: "nombre = $1, apellido = $2"
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');

    // El último parámetro corresponde al WHERE del ID
    const query = `UPDATE ${realTable} SET ${setClause} WHERE ${pk} = $${keys.length + 1} RETURNING *`;
    return await client.query(query, [...values, id]);
}

/**
 * Guarda un elemento:
 * - Si NO tiene ID (o el ID es 0), se trata de un nuevo elemento -> Llama a 'insertar()'.
 * - Si SÍ tiene un ID válido, se trata de una modificación -> Llama a 'actualizar()'.
 */
async function agregar(tabla, data) {
    const client = getSql();
    const realTable = await resolverTabla(client, tabla);
    const pk = await getPkColumn(client, realTable);
    const id = data && (data[pk] || data.id);

    if (!id || id == 0) {
        // Eliminamos posibles campos de ID vacíos antes de insertar
        const { [pk]: _, id: __, ...resto } = data;
        return await insertar(realTable, resto);
    } else {
        return await actualizar(realTable, data);
    }
}

/**
 * Elimina un registro de la base de datos según su ID.
 * Equivale a: DELETE FROM tabla WHERE columna_id = $1
 * 
 * @param {string} tabla - Tabla de la cual borrar.
 * @param {number|Object} data - Puede ser directamente el número de ID, o un objeto que contenga el ID.
 */
async function eliminar(tabla, data) {
    const client = getSql();
    const realTable = await resolverTabla(client, tabla);
    const pk = await getPkColumn(client, realTable);
    const id = typeof data === 'object' ? (data[pk] || data.id) : data;
    return await client.query(`DELETE FROM ${realTable} WHERE ${pk} = $1 RETURNING *`, [id]);
}

// Exportamos las funciones para que los controladores puedan usarlas
module.exports = {
    // Permite acceder directamente al cliente raw de Neon si alguien lo necesita
    get sql() {
        return getSql();
    },
    version,
    todos,
    uno,
    agregar,
    eliminar
};
