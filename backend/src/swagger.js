// ==============================================================================
// ARCHIVO: swagger.js
// PROPÓSITO: Especificación OpenAPI 3.0 para la documentación interactiva de la API.
// 
// ¿QUÉ ES SWAGGER / OPENAPI?
// OpenAPI es un estándar internacional (un formato estructurado en JSON u objeto JS)
// que describe qué URLs tiene tu servidor, qué parámetros reciben, qué devuelven
// y qué errores pueden ocurrir.
// 
// La librería 'swagger-ui-express' toma este objeto y lo dibuja como una página web
// hermosa e interactiva en http://localhost:3000/api-docs donde cualquier persona
// puede presionar "Try it out" y probar la API sin programar nada.
// ==============================================================================

const swaggerDocument = {
  // Versión de la especificación OpenAPI utilizada
  openapi: '3.0.0',

  // Información básica y título que se mostrará en el encabezado de la página web
  info: {
    title: 'API Consultorio MyV',
    version: '1.0.0',
    description: 'Documentación interactiva de la API para la gestión del consultorio con base de datos Neon PostgreSQL.'
  },

  // Servidores donde está disponible la API (en este caso, en tu máquina local)
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local de desarrollo'
    }
  ],

  // Etiquetas para agrupar visualmente los endpoints en categorías dentro de la página
  tags: [
    { name: 'Prácticas', description: 'Endpoints para la consulta de prácticas médicas/odontológicas y nomenclador' },
    { name: 'Pacientes', description: 'Endpoints para la gestión de pacientes' },
    { name: 'General', description: 'Endpoints generales y estado del sistema' }
  ],

  // ============================================================================
  // PATHS (Rutas de la API y qué métodos aceptan: GET, POST, PUT, DELETE)
  // ============================================================================
  paths: {
    // --------------------------------------------------------------------------
    // RUTA: GET / (Raíz)
    // --------------------------------------------------------------------------
    '/': {
      get: {
        tags: ['General'],
        summary: 'Verificar estado del servidor y Neon DB',
        description: 'Consulta SELECT version() en Neon PostgreSQL y retorna la versión instalada.',
        responses: {
          '200': {
            description: 'Servidor activo y versión de la base de datos',
            content: {
              'text/plain': {
                schema: { type: 'string', example: 'PostgreSQL 17.2 on x86_64-pc-linux-gnu...' }
              }
            }
          }
        }
      }
    },

    // --------------------------------------------------------------------------
    // RUTA: GET /api/practicas
    // --------------------------------------------------------------------------
    '/api/practicas': {
      get: {
        tags: ['Prácticas'],
        summary: 'Obtener todas las prácticas',
        description: 'Retorna el catálogo completo de prácticas registradas en la base de datos.',
        responses: {
          '200': {
            description: 'Listado de prácticas obtenido con éxito',
            content: {
              'application/json': {
                schema: {
                  // '$ref' reutiliza una estructura definida más abajo en 'components/schemas'
                  $ref: '#/components/schemas/RespuestaListaPracticas'
                }
              }
            }
          },
          '500': {
            description: 'Error del servidor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaError' }
              }
            }
          }
        }
      }
    },

    // --------------------------------------------------------------------------
    // RUTA: GET /api/practicas/{id}
    // --------------------------------------------------------------------------
    '/api/practicas/{id}': {
      get: {
        tags: ['Prácticas'],
        summary: 'Obtener una práctica por ID',
        description: 'Retorna los datos de una práctica según su id_practica.',
        // Parámetros que viajan incrustados en la URL
        parameters: [
          {
            name: 'id',
            in: 'path', // Significa que va en la ruta (ej: /api/practicas/1)
            required: true,
            description: 'Identificador numérico de la práctica',
            schema: { type: 'integer', example: 1 }
          }
        ],
        responses: {
          '200': {
            description: 'Práctica encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaUnaPractica' }
              }
            }
          },
          '500': {
            description: 'Error del servidor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaError' }
              }
            }
          }
        }
      }
    },

    // --------------------------------------------------------------------------
    // RUTA: /api/pacientes (GET, POST, PUT)
    // --------------------------------------------------------------------------
    '/api/pacientes': {
      // GET: Obtener todos los pacientes
      get: {
        tags: ['Pacientes'],
        summary: 'Obtener todos los pacientes',
        description: 'Retorna la lista completa de pacientes.',
        responses: {
          '200': {
            description: 'Listado de pacientes obtenido con éxito',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaListaPacientes' }
              }
            }
          },
          '500': {
            description: 'Error del servidor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaError' }
              }
            }
          }
        }
      },

      // POST: Crear o actualizar un paciente
      post: {
        tags: ['Pacientes'],
        summary: 'Crear o actualizar un paciente',
        description: 'Si el campo id no se envía o es 0, inserta un nuevo paciente. Si se incluye el id, actualiza el registro existente.',
        // 'requestBody' describe el JSON que el usuario debe enviar en la petición
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PacienteInput' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Paciente guardado o actualizado con éxito',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaExitosa' }
              }
            }
          },
          '500': {
            description: 'Error del servidor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaError' }
              }
            }
          }
        }
      },

      // PUT: Eliminar un paciente
      put: {
        tags: ['Pacientes'],
        summary: 'Eliminar un paciente',
        description: 'Elimina un paciente enviando su identificador numérico.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: {
                  id: { type: 'integer', example: 1 }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Paciente eliminado correctamente',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaExitosa' }
              }
            }
          },
          '500': {
            description: 'Error del servidor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaError' }
              }
            }
          }
        }
      }
    },

    // --------------------------------------------------------------------------
    // RUTA: GET /api/pacientes/{id}
    // --------------------------------------------------------------------------
    '/api/pacientes/{id}': {
      get: {
        tags: ['Pacientes'],
        summary: 'Obtener un paciente por ID',
        description: 'Retorna los datos de un paciente según su id_paciente.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Identificador numérico del paciente',
            schema: { type: 'integer', example: 1 }
          }
        ],
        responses: {
          '200': {
            description: 'Paciente encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaUnPaciente' }
              }
            }
          },
          '500': {
            description: 'Error del servidor',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaError' }
              }
            }
          }
        }
      }
    }
  },

  // ============================================================================
  // COMPONENTS (Modelos de datos reutilizables y esquemas de respuesta)
  // ============================================================================
  components: {
    schemas: {
      // Modelo de datos de una Práctica
      Practica: {
        type: 'object',
        properties: {
          id_practica: { type: 'integer', example: 1 },
          codigo_nomenclador: { type: 'string', example: '101' },
          nombre_nomenclador: { type: 'string', example: 'Examen - Diagnóstico - Fichado y Plan de Tratamiento' },
          nombre_referencia: { type: 'string', nullable: true, example: null },
          especialidad: { type: 'string', example: 'Consultas' },
          arancel_referencia: { type: 'string', example: '43720.00' },
          activo: { type: 'boolean', example: false }
        }
      },

      // Modelo de datos de un Paciente
      Paciente: {
        type: 'object',
        properties: {
          id_paciente: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Juan' },
          apellido: { type: 'string', example: 'Pérez' },
          dni: { type: 'string', example: '35123456' },
          fecha_nacimiento: { type: 'string', format: 'date', example: '1990-05-15' },
          telefono: { type: 'string', example: '1123456789' },
          domicilio: { type: 'string', example: 'Av. Corrientes 1234' },
          activo: { type: 'boolean', example: true }
        }
      },

      // Modelo de los datos que se reciben para crear o editar un paciente
      PacienteInput: {
        type: 'object',
        required: ['nombre', 'apellido'],
        properties: {
          id: { type: 'integer', example: 0, description: '0 para nuevo paciente, o id_paciente para actualizar' },
          nombre: { type: 'string', example: 'Juan' },
          apellido: { type: 'string', example: 'Pérez' },
          dni: { type: 'string', example: '35123456' },
          fecha_nacimiento: { type: 'string', format: 'date', example: '1990-05-15' },
          telefono: { type: 'string', example: '1123456789' },
          domicilio: { type: 'string', example: 'Av. Corrientes 1234' }
        }
      },

      // Estructura de respuesta de éxito general
      RespuestaExitosa: {
        type: 'object',
        properties: {
          error: { type: 'boolean', example: false },
          status: { type: 'integer', example: 200 },
          body: { type: 'string', example: 'Item guardado con exito' }
        }
      },

      // Estructura para la lista de prácticas
      RespuestaListaPracticas: {
        type: 'object',
        properties: {
          error: { type: 'boolean', example: false },
          status: { type: 'integer', example: 200 },
          body: {
            type: 'array',
            items: { $ref: '#/components/schemas/Practica' }
          }
        }
      },

      // Estructura para una sola práctica
      RespuestaUnaPractica: {
        type: 'object',
        properties: {
          error: { type: 'boolean', example: false },
          status: { type: 'integer', example: 200 },
          body: {
            type: 'array',
            items: { $ref: '#/components/schemas/Practica' }
          }
        }
      },

      // Estructura para la lista de pacientes
      RespuestaListaPacientes: {
        type: 'object',
        properties: {
          error: { type: 'boolean', example: false },
          status: { type: 'integer', example: 200 },
          body: {
            type: 'array',
            items: { $ref: '#/components/schemas/Paciente' }
          }
        }
      },

      // Estructura para un solo paciente
      RespuestaUnPaciente: {
        type: 'object',
        properties: {
          error: { type: 'boolean', example: false },
          status: { type: 'integer', example: 200 },
          body: {
            type: 'array',
            items: { $ref: '#/components/schemas/Paciente' }
          }
        }
      },

      // Estructura para respuestas de error
      RespuestaError: {
        type: 'object',
        properties: {
          error: { type: 'boolean', example: true },
          status: { type: 'integer', example: 500 },
          body: { type: 'string', example: 'Mensaje descriptivo del error' }
        }
      }
    }
  }
};

// Exportamos el objeto para ser leído por swaggerUi en app.js
module.exports = swaggerDocument;
