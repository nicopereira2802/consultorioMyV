import request from "supertest";
import app from "../index.js";
import sequelize from "../config/database.js";
import { sincronizarModelos } from "../models/index.model.js";

describe("POST /pacientes - Validación y Creación de Pacientes", () => {
  
  // CRUCIAL: Crear las tablas en la memoria de SQLite antes de ejecutar los tests
  beforeAll(async () => {
    await sequelize.authenticate();
    await sincronizarModelos(); // O usa: await sequelize.sync({ force: true });
  });

  // Cerrar la conexión al terminar la suite
  afterAll(async () => {
    await sequelize.close();
  });


  // ESCENARIO 1: ÉXITO ----------------------------------------------------------------------------------------------
  test("Debe crear un paciente exitosamente si los datos son válidos", async () => {
    const nuevoPaciente = {
      nombre: "Juan Pérez",
      apellido: "Hernandez",
      dni: 38123456,
      domicilio: "Av. Colón 1234, 2° B",
      fecha_nacimiento: "1995-05-20",
      telefono: "3511234567",
    };

    const response = await request(app).post("/api/pacientes").send(nuevoPaciente);
    expect(response.statusCode).toBe(201);
  });


  // ESCENARIO 2: FALLO POR REGLAS DE ZOD (Nombre con caracteres raros) ----------------------------------------------------------------------------------------------
  test("Debe rebotar la petición con 400 si el nombre contiene caracteres inválidos", async () => {
    const pacienteInvalido = {
      nombre: "Juan () {}", // Caracteres no permitidos por la Regex
      apellido: "Hernandez ()",
      dni: 38123456,
      domicilio: "Calle Falsa 123",
      fecha_nacimiento: "1995-05-20",
      telefono: "3511234567",
    };

    const response = await request(app).post("/api/pacientes").send(pacienteInvalido);

    expect(response.statusCode).toBe(400);
    expect(response.body.status).toBe("error");
    expect(response.body.errors).toHaveProperty("nombre");
  });


  // ESCENARIO 3: FALLO POR REGLAS DE EDAD (Fecha futura) ----------------------------------------------------------------------------------------------
  test("Debe rebotar la petición con 400 si la fecha de nacimiento es de un bebé o futura", async () => {
    const pacienteInvalido = {
      nombre: "Carlos Gómez",
      apellido: "Hernandez",
      dni: 40123456,
      domicilio: "San Martín 500",
      fecha_nacimiento: "2026-12-31", // Fecha futura
      telefono: "3511234567",
    };

    const response = await request(app).post("/api/pacientes").send(pacienteInvalido);

    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toHaveProperty("fecha_nacimiento");
  });
});
