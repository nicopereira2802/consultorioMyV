/**
 * MODELO ObraSocial:
 * id_obra_social -> INTEGER ; PK
 * nombre -> STRING ; allowNull: false ; activo -> BOOLEAN ; allowNull: false ; default: true
 * activo -> BOOLEAN ; allowNull: false ; default: true
 *
 * router.use("/api/obras-sociales", ObraSocialRoutes);
 *
 * RUTAS:
 * router.get("/", ObraSocialController.getAllObrasSociales);
 *
 * router.get(
 *   "/:id",
 *   validarExistencia(ObraSocial, "id", "params"),
 *   ObraSocialController.getObraSocialById,
 * );
 *
 * router.post(
 *   "/",
 *   validateSchema(createObraSocialSchema),
 *   ObraSocialController.createObraSocial,
 * );
 *
 * router.put(
 *   "/:id",
 *   validateSchema(updateObraSocialSchema),
 *   validarExistencia(ObraSocial, "id", "params"),
 *   ObraSocialController.updateObraSocial,
 * );
 *
 * router.patch(
 *   "/:id/delete",
 *   validarExistencia(ObraSocial, "id", "params"),
 *   ObraSocialController.deleteObraSocial,
 * );
 *
 * @format
 */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";

describe("Suite de Tests Completa para /api/obras-sociales", () => {
  let obraSocialId;

  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // ==========================================
  // 1. POST /api/obras-sociales (Creación & Zod)
  // ==========================================
  describe("POST /api/obras-sociales", () => {
    test("201: Crear una obra social correctamente", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        nombre: "OSDE 310",
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("id_obra_social");
      expect(res.body.data.nombre).toBe("OSDE 310");
      expect(res.body.data.activo).toBe(true);

      obraSocialId = res.body.data.id_obra_social || res.body.data.id;
    });

    test("201: Crear una segunda obra social para verificar consistencia en listados", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        nombre: "Swiss Medical",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.nombre).toBe("Swiss Medical");
    });

    // --- ERRORES DE VALIDACIÓN ZOD (400) ---
    test("400 Zod: Falla al no enviar el nombre (campo obligatorio)", async () => {
      const res = await request(app).post("/api/obras-sociales").send({});

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si el nombre es un string vacío o con solo espacios", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        nombre: "   ",
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si el tipo de dato del nombre es numérico o booleano", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        nombre: 12345,
      });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // 2. GET /api/obras-sociales (Listar todas)
  // ==========================================
  describe("GET /api/obras-sociales", () => {
    test("200: Debería obtener un arreglo con las obras sociales registradas", async () => {
      const res = await request(app).get("/api/obras-sociales");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ==========================================
  // 3. GET /api/obras-sociales/:id (Obtener por ID)
  // ==========================================
  describe("GET /api/obras-sociales/:id", () => {
    test("200: Debería obtener los datos de la obra social solicitada", async () => {
      const res = await request(app).get(`/api/obras-sociales/${obraSocialId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_obra_social || res.body.data.id).toBe(
        obraSocialId,
      );
      expect(res.body.data.nombre).toBe("OSDE 310");
    });

    test("404: Middleware validarExistencia devuelve 404 si la obra social no existe", async () => {
      const res = await request(app).get("/api/obras-sociales/99999");

      expect(res.status).toBe(404);
    });

    test("400 o 404: Falla si el ID enviado no es un entero válido", async () => {
      const res = await request(app).get("/api/obras-sociales/abc");

      expect([400, 404]).toContain(res.status);
    });
  });

  // ==========================================
  // 4. PUT /api/obras-sociales/:id (Actualización)
  // ==========================================
  describe("PUT /api/obras-sociales/:id", () => {
    test("200: Debería actualizar correctamente el nombre de la obra social", async () => {
      const res = await request(app)
        .put(`/api/obras-sociales/${obraSocialId}`)
        .send({
          nombre: "OSDE 410",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBe("OSDE 410");
    });

    test("400 Zod: Falla al intentar actualizar con un nombre inválido o vacío", async () => {
      const res = await request(app)
        .put(`/api/obras-sociales/${obraSocialId}`)
        .send({
          nombre: "",
        });

      expect(res.status).toBe(400);
    });

    test("404: Middleware validarExistencia devuelve 404 si el ID no existe", async () => {
      const res = await request(app).put("/api/obras-sociales/99999").send({
        nombre: "Sancor Salud",
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. PATCH /api/obras-sociales/:id/delete (Soft Delete)
  // ==========================================
  describe("PATCH /api/obras-sociales/:id/delete", () => {
    test("200: Debería desactivar lógicamente la obra social (activo: false)", async () => {
      const res = await request(app).patch(
        `/api/obras-sociales/${obraSocialId}/delete`,
      );

      expect(res.status).toBe(200);
    });

    test("404: Middleware validarExistencia devuelve 404 al intentar eliminar un ID inexistente", async () => {
      const res = await request(app).patch("/api/obras-sociales/99999/delete");

      expect(res.status).toBe(404);
    });
  });
});
