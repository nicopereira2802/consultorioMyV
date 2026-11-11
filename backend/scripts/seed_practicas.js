/** @format */
// Carga las prácticas del nomenclador "Aranceles Odontológicos - Colegio Odontológico (Agosto 2026)"
// desde aranceles.json y REEMPLAZA todo el contenido de la tabla `practicas`.
//
// Uso (desde la carpeta backend):
//   node scripts/seed_practicas.js                  -> lee scripts/aranceles.json
//   node scripts/seed_practicas.js ruta/otro.json   -> lee otro archivo
//
// - Usa la conexión del .env (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
// - ATENCIÓN: borra TODOS los registros actuales de `practicas` y deja solo los del JSON.
//   Todo ocurre en una transacción: si algo falla, la tabla queda como estaba.
// - Solo se guardan: codigo_nomenclador, nombre_nomenclador, nombre_referencia,
//   especialidad y precio_referencia. Costo fijo, variable, taller, total y honorario se ignoran.
// - Las prácticas "A CONVENIR" o sin valor se cargan con precio_referencia = NULL.
// - Códigos: se pasan al formato con puntos del nomenclador (101 -> 01.01, 40101 -> 04.01.01,
//   100201 -> 10.02.01). Si no querés convertirlos, hacé que formatearCodigo devuelva el código tal cual.

import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVO = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(__dirname, "aranceles.json");

const NOMBRE_REFERENCIA = "";
const GRUPOS_CIRUGIA = { 2: "dos", 3: "tres", 4: "cuatro" };
const LOTE = 100; // filas por INSERT

// 101 -> 01.01 | 1001 -> 10.01 | 40101 -> 04.01.01 | 100201 -> 10.02.01 | 11.02 -> 11.02
function formatearCodigo(codigo) {
  const c = String(codigo).trim();
  if (c.includes(".")) return c; // ya viene con puntos
  switch (c.length) {
    case 3:
      return `0${c[0]}.${c.slice(1)}`;
    case 4:
      return `${c.slice(0, 2)}.${c.slice(2)}`;
    case 5:
      return `0${c[0]}.${c.slice(1, 3)}.${c.slice(3)}`;
    case 6:
      return `${c.slice(0, 2)}.${c.slice(2, 4)}.${c.slice(4)}`;
    default:
      throw new Error(`Código con formato inesperado: ${codigo}`);
  }
}

// "PRÓTESIS" -> "Prótesis" | "PERSONAS CON DISCAPACIDAD" -> "Personas con discapacidad"
function formatearEspecialidad(texto) {
  const t = String(texto).trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Cirugía se separa en grupos según el código (10.02.xx = dos, 10.03.xx = tres, 10.04.xx = cuatro)
function armarNombreReferencia(codigo, especialidad) {
  if (especialidad !== "Cirugía") return NOMBRE_REFERENCIA;
  const m = codigo.match(/^10\.0([2-4])\.\d{2}$/);
  const grupo = m ? GRUPOS_CIRUGIA[m[1]] : "uno";
  return `${NOMBRE_REFERENCIA} · Cirugía grupo ${grupo}`;
}

function prepararFilas(practicas) {
  const filas = practicas.map((p, i) => {
    if (!p.codigo_nomenclador || !p.nombre_nomenclador || !p.especialidad) {
      throw new Error(`Registro #${i + 1} incompleto: ${JSON.stringify(p)}`);
    }
    const precio = p.precio_referencia ?? 0;
    if (precio !== null && !Number.isFinite(precio)) {
      throw new Error(`Precio inválido en ${p.codigo_nomenclador}: ${precio}`);
    }
    const codigo = formatearCodigo(p.codigo_nomenclador);
    const especialidad = formatearEspecialidad(p.especialidad);
    const nombre = String(p.nombre_nomenclador).trim();
    return [codigo, nombre, nombre, especialidad, precio];
  });

  const repetidos = filas.map((f) => f[0]).filter((c, i, arr) => arr.indexOf(c) !== i);
  if (repetidos.length) {
    throw new Error(`Códigos repetidos en el JSON: ${[...new Set(repetidos)].join(", ")}`);
  }
  return filas;
}

async function main() {
  const practicas = JSON.parse(await readFile(ARCHIVO, "utf8"));
  if (!Array.isArray(practicas) || practicas.length === 0) {
    throw new Error("El JSON está vacío o no es un arreglo de prácticas.");
  }
  const filas = prepararFilas(practicas);

  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await conexion.beginTransaction();

    const [borrado] = await conexion.query("DELETE FROM practica");

    for (let i = 0; i < filas.length; i += LOTE) {
      await conexion.query(
        `INSERT INTO practica
           (codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia)
         VALUES ?`,
        [filas.slice(i, i + LOTE)],
      );
    }

    await conexion.commit();

    const sinPrecio = filas.filter((f) => f[4] === null).length;
    console.log(`Registros eliminados: ${borrado.affectedRows}`);
    console.log(`Registros insertados: ${filas.length} (${filas.length - sinPrecio} con precio, ${sinPrecio} a convenir/sin precio)`);
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    await conexion.end();
  }
}

main().catch((error) => {
  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    console.error("No se pudo borrar `practica`: otras tablas tienen registros que la referencian (clave foránea).");
  }
  console.error("Error en el seed:", error.message);
  process.exit(1);
});