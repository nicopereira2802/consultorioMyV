// ==============================================================================
// ARCHIVO: tests/practicas.test.js
// PROPÓSITO: Pruebas de integración automatizadas para los endpoints de Prácticas.
// 
// ¿QUÉ ES JEST?
// Jest es un framework de testing para JavaScript. Nos proporciona funciones como:
// - describe(...): agrupa pruebas relacionadas en un bloque temático.
// - test(...) o it(...): define una prueba individual con una descripción de lo que debe ocurrir.
// - expect(...): hace una "afirmación" (assertion). Si la afirmación se cumple, el test pasa (verde);
//   si no se cumple, el test falla (rojo) y nos dice qué salió mal.
// 
// ¿QUÉ ES SUPERTEST?
// Supertest es una librería que permite enviar peticiones HTTP simuladas (GET, POST, etc.)
// a nuestra aplicación Express ('app') directamente en memoria, sin necesidad de levantar
// el servidor en el puerto 3000 con 'npm run dev'.
// ==============================================================================

// Importamos supertest para hacer peticiones HTTP
const request = require('supertest');

// Importamos nuestra aplicación Express ya configurada
const app = require('../src/app');

// Agrupamos las pruebas del módulo de prácticas
describe('Pruebas del módulo de Prácticas (GET /api/practicas)', () => {

    // --------------------------------------------------------------------------
    // TEST 1: Verificar el listado general de prácticas
    // --------------------------------------------------------------------------
    test('GET /api/practicas debe responder con status 200 y una lista de prácticas', async () => {
        // 1. Enviamos una petición GET simulada a la ruta '/api/practicas'
        const res = await request(app).get('/api/practicas');

        // 2. Afirmaciones (Expectations / Assertions):
        // Verificamos que el código de respuesta HTTP sea 200 (OK)
        expect(res.statusCode).toBe(200);

        // Verificamos que el cuerpo de la respuesta tenga la propiedad 'error' en false
        expect(res.body).toHaveProperty('error', false);

        // Verificamos que el campo 'status' dentro del JSON también sea 200
        expect(res.body).toHaveProperty('status', 200);

        // Verificamos que el campo 'body' sea un arreglo (Array / Lista de elementos)
        expect(Array.isArray(res.body.body)).toBe(true);

        // Verificamos que contenga al menos 1 práctica (en Neon DB cargamos 34 prácticas)
        expect(res.body.body.length).toBeGreaterThan(0);
    });

    // --------------------------------------------------------------------------
    // TEST 2: Verificar la búsqueda de una práctica específica por ID
    // --------------------------------------------------------------------------
    test('GET /api/practicas/:id debe responder con la práctica correspondiente', async () => {
        const idPrueba = 1;

        // Enviamos la petición con el ID 1 en la URL: '/api/practicas/1'
        const res = await request(app).get(`/api/practicas/${idPrueba}`);

        // Verificamos código 200 OK
        expect(res.statusCode).toBe(200);

        // Verificamos que no haya error
        expect(res.body).toHaveProperty('error', false);

        // Verificamos que la respuesta sea un arreglo con exactamente 1 elemento
        expect(Array.isArray(res.body.body)).toBe(true);
        expect(res.body.body.length).toBe(1);

        // Verificamos que el registro devuelto tenga la columna 'id_practica' igual a 1
        expect(res.body.body[0]).toHaveProperty('id_practica', idPrueba);

        // Verificamos que tenga los campos esenciales esperados
        expect(res.body.body[0]).toHaveProperty('nombre_nomenclador');
        expect(res.body.body[0]).toHaveProperty('arancel_referencia');
    });
});
