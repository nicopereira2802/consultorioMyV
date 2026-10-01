/**
 * MODELO Paciente
 * id_paciente -> INTEGER -> PK
 * nombre -> STRING -> allowNull: false
 * apellido -> STRING -> allowNull: false
 * dni -> STRING -> allowNull: true ; unique: true
 * fecha_nacimiento -> DATEONLY -> allowNull: true
 * telefono -> STRING -> allowNull: false
 * domicilio -> STRING -> allowNull: true
 * activo -> BOOLEAN ; allowNull: false ; default: true
 *
 * router.use("/api/pacientes", PacienteRoutes);
 *
 * RUTAS:
 * router.get("/", PacienteController.getAllPacientes);
 *
 * router.get(
 *   "/:id",
 *   validarExistencia(Paciente, "id", "params"),
 *   PacienteController.getPacienteById,
 * );
 *
 * router.post(
 *   "/",
 *   validateSchema(createPacienteSchema),
 *   PacienteController.createPaciente,
 * );
 *
 * router.put(
 *   "/:id",
 *   validateSchema(updatePacienteSchema),
 *   validarExistencia(Paciente, "id", "params"),
 *   PacienteController.updatePaciente,
 * );
 *
 * router.patch(
 *   "/:id/delete",
 *   validarExistencia(Paciente, "id", "params"),
 *   PacienteController.deletePaciente,
 * );
 *
 * @format
 */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";

describe("Suite de Tests Completa para /api/pacientes", () => {
  let pacienteId;
  let pacienteIdOpcional;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. POST /api/pacientes (Creación & Zod)
  // ==========================================
  describe("POST /api/pacientes", () => {
    test("201: Crear un paciente con todos los campos completos", async () => {
      const res = await request(app).post("/api/pacientes").send({
        nombre: "Mateo",
        apellido: "Aronna",
        dni: "40123456",
        fecha_nacimiento: "2000-05-15",
        telefono: "3511234567",
        domicilio: "Av. Colón 1234",
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("id_paciente");
      expect(res.body.data.nombre).toBe("Mateo");
      expect(res.body.data.dni).toBe("40123456");
      expect(res.body.data.activo).toBe(true);

      pacienteId = res.body.data.id_paciente || res.body.data.id;
    });

    test("201: Crear un paciente solo con los campos obligatorios (sin DNI, fecha_nacimiento ni domicilio)", async () => {
      const res = await request(app).post("/api/pacientes").send({
        nombre: "Sofía",
        apellido: "Gómez",
        telefono: "3519876543",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.nombre).toBe("Sofía");
      expect(res.body.data.dni).toBeNull();

      pacienteIdOpcional = res.body.data.id_paciente || res.body.data.id;
    });

    // --- ERRORES DE VALIDACIÓN ZOD (400) ---
    test("400 Zod: Error si faltan campos obligatorios (sin nombre)", async () => {
      const res = await request(app).post("/api/pacientes").send({
        apellido: "Pérez",
        telefono: "3510000000",
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Error si faltan campos obligatorios (sin teléfono)", async () => {
      const res = await request(app).post("/api/pacientes").send({
        nombre: "Lucas",
        apellido: "Pérez",
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Error si el tipo de dato es incorrecto (nombre como número)", async () => {
      const res = await request(app).post("/api/pacientes").send({
        nombre: 12345,
        apellido: "Pérez",
        telefono: "3510000000",
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Error si el nombre o apellido contienen caracteres numéricos/inválidos", async () => {
      const res = await request(app).post("/api/pacientes").send({
        nombre: "Mateo123",
        apellido: "Aronna{}",
        telefono: "3510000000",
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Error si el formato de la fecha de nacimiento no es YYYY-MM-DD", async () => {
      const res = await request(app).post("/api/pacientes").send({
        nombre: "Valeria",
        apellido: "Rios",
        telefono: "3510000000",
        fecha_nacimiento: "15/05/2000", // Formato incorrecto
      });

      expect(res.status).toBe(400);
    });

    // --- RESTRICCIÓN DE BD O CONTROLLER (400 / 409) ---
    test("400 o 409: Error al intentar registrar un DNI que ya existe en la BD", async () => {
      const res = await request(app).post("/api/pacientes").send({
        nombre: "Carlos",
        apellido: "Aronna",
        dni: "40123456", // Mismo DNI que el primer test
        telefono: "3511112222",
      });

      // Zod o Sequelize UniqueConstraintError deberían rebotar la petición
      expect([400, 409]).toContain(res.status);
    });
  });

  // ==========================================
  // 2. GET /api/pacientes (Listar todos)
  // ==========================================
  describe("GET /api/pacientes", () => {
    test("200: Debería obtener un arreglo con todos los pacientes registrados", async () => {
      const res = await request(app).get("/api/pacientes");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================
  // 3. GET /api/pacientes/:id (Obtener por ID)
  // ==========================================
  describe("GET /api/pacientes/:id", () => {
    test("200: Debería obtener los datos del paciente solicitado por ID", async () => {
      const res = await request(app).get(`/api/pacientes/${pacienteId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_paciente || res.body.data.id).toBe(pacienteId);
      expect(res.body.data.nombre).toBe("Mateo");
    });

    test("404: Middleware validarExistencia devuelve 404 si el paciente no existe", async () => {
      const res = await request(app).get("/api/pacientes/99999");

      expect(res.status).toBe(404);
    });

    test("400: Error si el parámetro ID no es un entero válido", async () => {
      const res = await request(app).get("/api/pacientes/abc");

      expect([400, 404]).toContain(res.status);
    });
  });

  // ==========================================
  // 4. PUT /api/pacientes/:id (Actualización)
  // ==========================================
  describe("PUT /api/pacientes/:id", () => {
    test("200: Actualizar correctamente el teléfono y domicilio de un paciente", async () => {
      const res = await request(app).put(`/api/pacientes/${pacienteId}`).send({
        nombre: "Mateo",
        apellido: "Aronna",
        dni: "40123456",
        telefono: "3519998877",
        domicilio: "Nuevas Heras 4321",
      });

      expect(res.status).toBe(200);
      expect(res.body.data.telefono).toBe("3519998877");
      expect(res.body.data.domicilio).toBe("Nuevas Heras 4321");
    });

    test("400 Zod: Rechazar actualización con teléfono o formato inválido", async () => {
      const res = await request(app).put(`/api/pacientes/${pacienteId}`).send({
        nombre: "Mateo",
        apellido: "Aronna",
        telefono: "", // Teléfono vacío si es requerido
      });

      expect(res.status).toBe(400);
    });

    test("404: Middleware validarExistencia devuelve 404 al intentar editar un ID inexistente", async () => {
      const res = await request(app).put("/api/pacientes/99999").send({
        nombre: "Inexistente",
        apellido: "User",
        telefono: "3510000000",
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. PATCH /api/pacientes/:id/delete (Soft Delete)
  // ==========================================
  describe("PATCH /api/pacientes/:id/delete", () => {
    test("200: Realizar baja lógica / cambio de estado 'activo' a false", async () => {
      const res = await request(app).patch(
        `/api/pacientes/${pacienteId}/delete`,
      );

      expect(res.status).toBe(200);
    });

    test("404: Devolver 404 si el ID a eliminar no existe", async () => {
      const res = await request(app).patch("/api/pacientes/99999/delete");

      expect(res.status).toBe(404);
    });
  });
});
