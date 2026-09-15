// ==============================================================================
// ARCHIVO: tests/general.test.js
// PROPÓSITO: Pruebas de integración para rutas generales, documentación Swagger
// y endpoints utilitarios del servidor.
// ==============================================================================

const request = require('supertest');
const app = require('../src/app');

describe('Pruebas de endpoints generales y Swagger', () => {

    // --------------------------------------------------------------------------
    // TEST 1: Verificar que Swagger UI se cargue correctamente
    // --------------------------------------------------------------------------
    test('GET /api-docs/ debe servir la interfaz de Swagger UI', async () => {
        const res = await request(app).get('/api-docs/');

        // Debe responder con código 200 (OK)
        expect(res.statusCode).toBe(200);

        // El HTML devuelto debe incluir las librerías de 'swagger-ui'
        expect(res.text).toContain('swagger-ui');
    });

    // --------------------------------------------------------------------------
    // TEST 2: Verificar la ruta de silenciamiento para Chrome DevTools
    // --------------------------------------------------------------------------
    test('GET /.well-known/appspecific/com.chrome.devtools.json responde 204 No Content', async () => {
        const res = await request(app).get('/.well-known/appspecific/com.chrome.devtools.json');

        // Código 204 significa "Petición exitosa, sin contenido en el cuerpo"
        expect(res.statusCode).toBe(204);
    });

    // --------------------------------------------------------------------------
    // TEST 3: Verificar que el módulo de pacientes responda 200
    // --------------------------------------------------------------------------
    test('GET /api/pacientes debe responder con status 200', async () => {
        const res = await request(app).get('/api/pacientes');

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('error', false);
        expect(Array.isArray(res.body.body)).toBe(true);
    });
});
