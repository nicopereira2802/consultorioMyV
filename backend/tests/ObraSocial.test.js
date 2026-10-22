/**
 * MODELO ObraSocial (HU O-123: Gestión Completa de Obras Sociales):
 * id_obra_social -> INTEGER ; PK
 * nombre -> STRING ; allowNull: false
 * razon_social -> STRING ; allowNull: false
 * telefono -> STRING ; allowNull: true
 * email -> STRING ; allowNull: true
 * activo -> BOOLEAN ; allowNull: false ; default: true
 *
 * router.use("/api/obras-sociales", ObraSocialRoutes);
 *
 * RUTAS:
 * router.get("/", ObraSocialController.getAllObrasSociales);
 * router.get("/:id", validarExistencia(ObraSocial, "id", "params"), ObraSocialController.getObraSocialById);
 * router.post("/", validateSchema(createObraSocialSchema), ObraSocialController.createObraSocial);
 * router.put("/:id", validateSchema(updateObraSocialSchema), validarExistencia(ObraSocial, "id", "params"), ObraSocialController.updateObraSocial);
 * router.patch("/:id/delete", validarExistencia(ObraSocial, "id", "params"), ObraSocialController.toggleObraSocial);
 * router.delete("/:id/delete", validarExistencia(ObraSocial, "id", "params"), ObraSocialController.deleteObraSocial);
 *
 * @format
 */

import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";

describe("Suite de Tests Completa para /api/obras-sociales (HU O-123)", () => {
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
  describe("POST /api/obras-sociales (Alta de Obra Social)", () => {
    // Prueba de Usuario 1 de la HU O-123 (PASA)
    test("201 (HU O-123): Probar registrar una nueva obra social completando su nombre y razón social, y verificar que aparece en estado activo", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        nombre: "OSDE 310",
        razon_social: "Organización de Servicios Directos Empresarios",
        telefono: "08105556733",
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data).toHaveProperty("id_obra_social");
      expect(res.body.data.nombre).toBe("OSDE 310");
      expect(res.body.data.razon_social).toBe(
        "Organización de Servicios Directos Empresarios",
      );
      expect(res.body.data.telefono).toBe("08105556733");
      expect(res.body.data.activo).toBe(true);

      obraSocialId = res.body.data.id_obra_social || res.body.data.id;
    });

    test("201: Crear una segunda obra social para verificar consistencia en listados", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        nombre: "Swiss Medical",
        razon_social: "Swiss Medical S.A.",
        telefono: "08104447700",
      });

      expect(res.status).toBe(201);
      expect(res.body.data.nombre).toBe("Swiss Medical");
      expect(res.body.data.razon_social).toBe("Swiss Medical S.A.");
      expect(res.body.data.activo).toBe(true);
    });

    // --- ERRORES DE VALIDACIÓN ZOD (Pruebas Negativas - FALLA) ---
    // Prueba de Usuario 3 (Parte 1 - FALLA al omitir nombre)
    test("400 (HU O-123): Falla al guardar nueva obra social omitiendo el nombre", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        razon_social: "Entidad Médica S.A.",
        telefono: "3514001122",
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty("nombre");
    });

    test("400 (HU O-123): Falla al guardar nueva obra social omitiendo la razón social (campo obligatorio)", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        nombre: "Apross Salud",
      });

      expect(res.status).toBe(400);
      expect(res.body.errors).toHaveProperty("razon_social");
    });

    test("400 Zod: Falla si el nombre es un string vacío o con solo espacios", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        nombre: "   ",
        razon_social: "Razón Social Valida",
      });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla si el tipo de dato del nombre es numérico o booleano", async () => {
      const res = await request(app).post("/api/obras-sociales").send({
        nombre: 12345,
        razon_social: "Razón Social Valida",
      });

      expect(res.status).toBe(400);
    });
  });

  // ==========================================
  // 2. GET /api/obras-sociales (Listar catálogo)
  // ==========================================
  describe("GET /api/obras-sociales (Listado de Coberturas)", () => {
    test("200 (HU O-123): Debería verificar que la obra social registrada aparece en la lista de coberturas disponibles", async () => {
      const res = await request(app).get("/api/obras-sociales");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      const encontrada = res.body.data.find(
        (os) => (os.id_obra_social || os.id) === obraSocialId,
      );
      expect(encontrada).toBeDefined();
      expect(encontrada.nombre).toBe("OSDE 310");
      expect(encontrada.razon_social).toBe(
        "Organización de Servicios Directos Empresarios",
      );
      expect(encontrada.activo).toBe(true);
    });

    test("200: Soporta búsqueda por razón social y nombre", async () => {
      const res = await request(app)
        .get("/api/obras-sociales")
        .query({ search: "Directos" });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].razon_social).toContain("Directos");
    });
  });

  // ==========================================
  // 3. GET /api/obras-sociales/:id (Obtener Detalle)
  // ==========================================
  describe("GET /api/obras-sociales/:id (Detalle de Obra Social)", () => {
    test("200: Debería obtener los datos completos de la obra social solicitada", async () => {
      const res = await request(app).get(`/api/obras-sociales/${obraSocialId}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.id_obra_social || res.body.data.id).toBe(
        obraSocialId,
      );
      expect(res.body.data.nombre).toBe("OSDE 310");
      expect(res.body.data.razon_social).toBe(
        "Organización de Servicios Directos Empresarios",
      );
      expect(res.body.data.telefono).toBe("08105556733");
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
  // 4. PUT /api/obras-sociales/:id (Modificación)
  // ==========================================
  describe("PUT /api/obras-sociales/:id (Edición de Obra Social)", () => {
    // Prueba de Usuario 2 de la HU O-123 (PASA)
    test("200 (HU O-123): Probar modificar el teléfono de contacto de una obra social existente y verificar que el cambio se refleja en el listado y en el detalle", async () => {
      const nuevoTelefono = "08108889900";

      // 1. Modificar el teléfono
      const resPut = await request(app)
        .put(`/api/obras-sociales/${obraSocialId}`)
        .send({
          telefono: nuevoTelefono,
        });

      expect(resPut.status).toBe(200);
      expect(resPut.body.data.telefono).toBe(nuevoTelefono);

      // 2. Verificar que se refleja en el detalle (GET /:id)
      const resGet = await request(app).get(
        `/api/obras-sociales/${obraSocialId}`,
      );
      expect(resGet.status).toBe(200);
      expect(resGet.body.data.telefono).toBe(nuevoTelefono);

      // 3. Verificar que se refleja en el listado general (GET /)
      const resList = await request(app).get("/api/obras-sociales");
      expect(resList.status).toBe(200);
      const enLista = resList.body.data.find(
        (os) => (os.id_obra_social || os.id) === obraSocialId,
      );
      expect(enLista.telefono).toBe(nuevoTelefono);
    });

    test("200: Debería actualizar correctamente el nombre y razón social", async () => {
      const res = await request(app)
        .put(`/api/obras-sociales/${obraSocialId}`)
        .send({
          nombre: "OSDE 410",
          razon_social: "OSDE Binario Servicios Médicos",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.nombre).toBe("OSDE 410");
      expect(res.body.data.razon_social).toBe("OSDE Binario Servicios Médicos");
    });

    // Prueba de Usuario 3 (Parte 2 - FALLA al intentar guardar la edición borrando el nombre)
    test("400 (HU O-123): Falla al intentar guardar la edición borrando por completo el campo del nombre", async () => {
      const res = await request(app)
        .put(`/api/obras-sociales/${obraSocialId}`)
        .send({
          nombre: "",
        });

      expect(res.status).toBe(400);
    });

    test("400 Zod: Falla al intentar actualizar con un nombre compuesto solo de espacios", async () => {
      const res = await request(app)
        .put(`/api/obras-sociales/${obraSocialId}`)
        .send({
          nombre: "   ",
        });

      expect(res.status).toBe(400);
    });

    test("404: Middleware validarExistencia devuelve 404 si el ID no existe", async () => {
      const res = await request(app).put("/api/obras-sociales/99999").send({
        nombre: "Sancor Salud",
        razon_social: "Sancor Salud Mutual",
      });

      expect(res.status).toBe(404);
    });
  });

  // ==========================================
  // 5. PATCH /api/obras-sociales/:id/delete (Soft Delete / Toggle)
  // ==========================================
  describe("PATCH /api/obras-sociales/:id/delete (Desactivar Obra Social)", () => {
    test("200: Debería desactivar lógicamente la obra social (activo: false)", async () => {
      const res = await request(app).patch(
        `/api/obras-sociales/${obraSocialId}/delete`,
      );

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.activo).toBe(false);
    });

    test("404: Middleware validarExistencia devuelve 404 al intentar alternar un ID inexistente", async () => {
      const res = await request(app).patch("/api/obras-sociales/99999/delete");

      expect(res.status).toBe(404);
    });
  });
});
