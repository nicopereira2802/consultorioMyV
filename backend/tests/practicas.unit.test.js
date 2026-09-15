// ==============================================================================
// ARCHIVO: tests/practicas.unit.test.js
// PROPÓSITO: Pruebas UNITARIAS (Unit Testing) con simulaciones (Mocks).
// 
// ¿QUÉ ES UNA PRUEBA UNITARIA?
// Es una prueba que evalúa una sola pieza aislada de código (en este caso, la lógica
// interna de las funciones de nuestro controlador), sin interactuar con bases de datos
// reales ni con internet.
// 
// ¿QUÉ ES UN "MOCK"?
// Un Mock es un objeto "falso" o de utilería. En lugar de conectar el controlador a PostgreSQL,
// le entregamos un objeto falso que simula responder como si fuera la base de datos.
// Con esto logramos:
// 1. Tests ultra veloces (se ejecutan en milisegundos).
// 2. Probar el código incluso sin conexión a internet.
// 3. Probar escenarios hipotéticos o errores controlados.
// ==============================================================================

// Importamos la función creadora del controlador
const controlador = require('../src/modulos/practicas/controlador');

describe('Pruebas unitarias del controlador de Prácticas (con Mock)', () => {

    // ==========================================================================
    // CREAMOS LA BASE DE DATOS FALSA (MOCK DE BD)
    // Usamos 'jest.fn()' que crea una función espía de Jest capaz de recordar
    // cuántas veces fue llamada y con qué argumentos.
    // ==========================================================================
    const mockDb = {
        // 'mockResolvedValue' hace que la función devuelva una Promesa resuelta con estos datos falsos
        todos: jest.fn().mockResolvedValue([
            { id_practica: 1, nombre_nomenclador: 'Consulta Test', arancel_referencia: '5000.00' }
        ]),

        // 'mockImplementation' nos permite simular lógica dinámica según el parámetro recibido
        uno: jest.fn().mockImplementation((tabla, id) => {
            return Promise.resolve([
                { id_practica: id, nombre_nomenclador: `Práctica ${id}`, arancel_referencia: '10000.00' }
            ]);
        })
    };

    // ==========================================================================
    // INYECCIÓN DE DEPENDENCIAS
    // Le pasamos nuestro 'mockDb' falso al controlador.
    // ==========================================================================
    const ctrl = controlador(mockDb);

    // --------------------------------------------------------------------------
    // TEST 1: Verificar que 'todos()' consulte la tabla correcta
    // --------------------------------------------------------------------------
    test('todos() debe llamar a la BD con la tabla practica y retornar los datos simulados', async () => {
        // Ejecutamos la función del controlador
        const resultado = await ctrl.todos();

        // Verificamos que el controlador llamó a la función 'todos' de la BD pasándole el nombre de tabla 'practica'
        expect(mockDb.todos).toHaveBeenCalledWith('practica');

        // Verificamos que devolvió los datos falsos que configuramos en el mock
        expect(resultado.length).toBe(1);
        expect(resultado[0].nombre_nomenclador).toBe('Consulta Test');
    });

    // --------------------------------------------------------------------------
    // TEST 2: Verificar que 'uno(id)' consulte por el ID solicitado
    // --------------------------------------------------------------------------
    test('uno(id) debe consultar por el ID especificado y retornar la práctica simulada', async () => {
        const idBuscado = 5;

        // Ejecutamos pidiendo el ID 5
        const resultado = await ctrl.uno(idBuscado);

        // Verificamos que el controlador le pasó 'practica' y el número 5 a la base de datos
        expect(mockDb.uno).toHaveBeenCalledWith('practica', idBuscado);

        // Verificamos que el resultado contenga el ID 5
        expect(resultado[0].id_practica).toBe(idBuscado);
    });
});
