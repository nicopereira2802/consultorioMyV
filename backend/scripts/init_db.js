import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDB() {
  const host = process.env.DB_HOST || 'localhost';
  const port = Number(process.env.DB_PORT) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASS || process.env.DB_PASSWORD || '';

  console.log(`Conectando a MySQL en ${host}:${port} con usuario '${user}'...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    const sqlPath = path.join(__dirname, '../database/init_db.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró el archivo SQL en: ${sqlPath}`);
    }

    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('Ejecutando database/init_db.sql...');
    await connection.query(sqlScript);

    console.log('¡Base de datos consultorio_myv inicializada y cargada con éxito!');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initDB();