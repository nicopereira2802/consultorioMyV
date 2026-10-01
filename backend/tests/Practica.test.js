/**
 * MODELO Practica
 * id_practica -> INTEGER ; PK
 * codigo_nomenclador -> STRING ; allowNull: false
 * nombre_nomenclador -> STRING ; allowNull: false
 * nombre_referencia -> STRING ; allowNull: false
 * especialidad -> STRING ; allowNull: false
 * precio_referencia -> DECIMAL(10, 2) ; allowNull: false
 * activo -> BOOLEAN ; allowNull: false ; default: true
 *
 * router.use("/api/practicas", PracticaRoutes);
 *
 * RUTAS:
 * router.get("/", PracticaController.getAllPracticas);
 *
 * router.get(
 *   "/:id",
 *   validarExistencia(Practica, "id", "params"),
 *   PracticaController.getPracticaById,
 * );
 *
 * router.post(
 *   "/",
 *   validateSchema(createPracticaSchema),
 *   PracticaController.createPractica,
 * );
 *
 * router.put(
 *   "/:id",
 *   validateSchema(updatePracticaSchema),
 *   validarExistencia(Practica, "id", "params"),
 *   PracticaController.updatePractica,
 * );
 *
 * router.patch(
 *   "/:id/delete",
 *   validarExistencia(Practica, "id", "params"),
 *   PracticaController.deletePractica,
 * );
 *
 * @format
 */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";

describe("Suite de Tests Completa para /api/practicas", () => {
  let practicaId;

  // CRUCIAL: Crear las tablas en la memoria de SQLite antes de ejecutar los tests
  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();
  });

  // Cerrar la conexión al terminar la suite
  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. POST /api/practicas (Creación & Zod)
  // ==========================================
  describe("POST /api/practicas", () => {
    test("201: Debería crear una nueva práctica correctamente", async () => {
      const res = await request(app).post("/api/practicas").send({
        codigo_nomenclador: "01.01",
        nombre_nomenclador: "Examen, diagnostico y plan de tratamiento",
        nombre_referencia: "Consulta General",
        especialidad: "Odontología General",
        precio_referencia: 15000.5,
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("id_practica");
      expect(res.body.data.codigo_nomenclador).toBe("01.01");
      expect(Number(res.body.data.precio_referencia)).toBe(15000.5);
      expect(res.body.data.activo).toBe(true);

      // Guardamos el ID para usarlo en los siguientes tests
      practicaId = res.body.data.id_practica || res.body.data.id;
    });

    test("201: Crear una segunda práctica para verificar consistencia en listados", async () => {
      const res = await request(app).post("/api/practicas").send({
        codigo_nomenclador: "02.01",
        nombre_nomenclador: "Restauración de amalgama cavidad simple",
        nombre_referencia: "Arreglo Carie Simple",
        especialidad: "Operatoria",
        precio_referencia: 25000.0,
      });

      expect(res.status).toBe(201);
    });

    // --- ERRORES DE VALIDACIÓN ZOD (400) ---
    test("400 Zod: Falla al omitir un campo obligatorio (sin nombre_nomenclador)", async () => {
      const res = await request(app).post("/api/practicas").send({
        codigo_nomenclador: "01.02",
        nombre_referencia: "Limpieza Dental",
        especialidad: "Limpieza",
        precio_referencia: 12000,
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si el precio es un número negativo o no válido", async () => {
      const res = await request(app).post("/api/practicas").send({
        codigo_nomenclador: "01.03",
        nombre_nomenclador: "Limpieza Dental",
        nombre_referencia: "Limpieza Dental",
        especialidad: "Limpieza",
        precio_referencia: -500,
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si el tipo de dato es incorrecto (código como número en vez de string)", async () => {
      const res = await request(app).post("/api/practicas").send({
        codigo_nomenclador: 1010,
        nombre_nomenclador: "Limpieza Dental",
        nombre_referencia: "Limpieza Dental",
        especialidad: "Limpieza",
        precio_referencia: 12000,
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si se envían strings vacíos en campos obligatorios", async () => {
      const res = await request(app).post("/api/practicas").send({
        codigo_nomenclador: "01.04",
        nombre_nomenclador: "",
        nombre_referencia: "   ",
        especialidad: "Limpieza",
        precio_referencia: 12000,
      });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // 2. GET /api/practicas (Listar todas)
  // ==========================================
  describe("GET /api/practicas", () => {
    test("200: Debería obtener la lista de prácticas registradas", async () => {
      const res = await request(app).get("/api/practicas");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================
  // 3. GET /api/practicas/:id (Obtener por ID)
  // ==========================================
  describe("GET /api/practicas/:id", () => {
    test("200: Debería obtener una práctica por ID existente", async () => {
      const res = await request(app).get(`/api/practicas/${practicaId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_practica || res.body.data.id).toBe(practicaId);
      expect(res.body.data.codigo_nomenclador).toBe("01.01");
    });

    test("404: Middleware validarExistencia devuelve 404 si la práctica no existe", async () => {
      const res = await request(app).get("/api/practicas/99999");

      expect(res.status).toBe(404);
    });

    test("400 o 404: Falla si el ID no es un formato de número entero válido", async () => {
      const res = await request(app).get("/api/practicas/abc");

      expect([400, 404]).toContain(res.status);
    });
  });

  // ==========================================
  // 4. PUT /api/practicas/:id (Actualización)
  // ==========================================
  describe("PUT /api/practicas/:id", () => {
    test("200: Debería actualizar correctamente los datos de la práctica", async () => {
      const res = await request(app).put(`/api/practicas/${practicaId}`).send({
        codigo_nomenclador: "01.01",
        nombre_nomenclador:
          "Examen, diagnostico y plan de tratamiento",
        nombre_referencia: "Consulta General Premium",
        especialidad: "Odontología General",
        precio_referencia: 18000.0,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre_referencia).toBe("Consulta General Premium");
      expect(Number(res.body.data.precio_referencia)).toBe(18000.0);
    });

    test("400 Zod: Falla al intentar actualizar con un precio inválido", async () => {
      const res = await request(app).put(`/api/practicas/${practicaId}`).send({
        codigo_nomenclador: "01.01",
        nombre_nomenclador: "Examen, diagnostico y plan de tratamiento",
        nombre_referencia: "Consulta General",
        especialidad: "Odontología General",
        precio_referencia: "precio_gratis",
      });

      expect(res.status).toBe(400);
    });

    test("404: Middleware validarExistencia devuelve 404 al intentar actualizar una práctica inexistente", async () => {
      const res = await request(app).put("/api/practicas/99999").send({
        codigo_nomenclador: "00.00",
        nombre_nomenclador: "Inexistente",
        nombre_referencia: "Inexistente",
        especialidad: "General",
        precio_referencia: 1000,
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. PATCH /api/practicas/:id/delete (Soft Delete)
  // ==========================================
  describe("PATCH /api/practicas/:id/delete", () => {
    test("200: Debería desactivar o eliminar lógicamente una práctica existente", async () => {
      const res = await request(app).patch(
        `/api/practicas/${practicaId}/delete`,
      );

      expect(res.status).toBe(200);
    });

    test("404: Middleware validarExistencia devuelve 404 al intentar eliminar un ID inexistente", async () => {
      const res = await request(app).patch("/api/practicas/99999/delete");

      expect(res.status).toBe(404);
    });
  });
});
