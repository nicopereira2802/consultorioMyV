import { Usuario } from "../models/index.model.js";

describe("Modelo Usuario", () => {
  test("Debería estar definido el modelo Usuario", () => {
    expect(Usuario).toBeDefined();
  });
});