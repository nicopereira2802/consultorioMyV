import { Paciente } from "../models/Paciente.model.js";

// Obtener todos los pacientes
export const getAllPacientes = async (req, res) => {
  try {
    const pacientes = await Paciente.findAll();

    res.status(200).json(pacientes);
  } catch (error) {
    console.error("Error al obtener los pacientes:", error);
    res.status(500).json({ error: "Error al obtener los pacientes" });
  }
};

// Obtener un paciente por su ID
export const getPacienteById = async (req, res) => {
  const { id } = req.params;
  try {
    const paciente = await Paciente.findByPk(id);
    if (paciente) {
      res.status(200).json(paciente);
    } else {
      res.status(404).json({ error: "Paciente no encontrado" });
    }
  } catch (error) {
    console.error("Error al obtener el paciente:", error);
    res.status(500).json({ error: "Error al obtener el paciente" });
  }
};


// Crear un nuevo paciente
export const createPaciente = async (req, res) => {
  const { nombre, apellido, fecha_nacimiento, fechaNacimiento, dni, telefono, domicilio } = req.body;

  // 1. Validar campos obligatorios según el criterio de aceptación
  const faltantes = [];
  if (!nombre || !nombre.trim()) faltantes.push("nombre");
  if (!apellido || !apellido.trim()) faltantes.push("apellido");
  if (!telefono || !telefono.trim()) faltantes.push("telefono");

  if (faltantes.length > 0) {
    return res.status(400).json({
      error: "Campos obligatorios incompletos",
      mensaje: `Los siguientes campos son requeridos: ${faltantes.join(", ")}.`,
      campos: faltantes,
    });
  }

  try {
    // 2. Verificar duplicidad de teléfono manualmente
    const telefonoLimpio = telefono.trim();
    const existeTelefono = await Paciente.findOne({
      where: { telefono: telefonoLimpio },
    });

    if (existeTelefono) {
      return res.status(409).json({
        error: "Conflicto de datos",
        mensaje: "El número de teléfono ya se encuentra registrado para otro paciente.",
        campo: "telefono",
      });
    }

    // 3. Crear el registro con los datos recibidos
    const newPaciente = await Paciente.create({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefonoLimpio,
      dni: dni ? dni.trim() : null,
      fecha_nacimiento: fecha_nacimiento || fechaNacimiento || null,
      domicilio: domicilio ? domicilio.trim() : null,
    });

    return res.status(201).json({
      mensaje: "Paciente registrado exitosamente",
      paciente: newPaciente,
    });
  } catch (error) {
    console.error("Error al crear el paciente:", error);
    return res.status(500).json({
      error: "Error del servidor",
      mensaje: "Ocurrió un problema interno al registrar el paciente. Intente nuevamente.",
    });
  }
};

// Actualizar un paciente existente
export const updatePaciente = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, fechaNacimiento, dni, telefono, domicilio } = req.body;

  try {
    const paciente = await Paciente.findByPk(id);
    if (paciente) {
      paciente.nombre = nombre;
      paciente.apellido = apellido;
      paciente.fechaNacimiento = fechaNacimiento;
      paciente.dni = dni;
      paciente.telefono = telefono;
      paciente.domicilio = domicilio;
      await paciente.save();
      res.status(200).json(paciente);
    } else {
      res.status(404).json({ error: "Paciente no encontrado" });
    }
  } catch (error) {
    console.error("Error al actualizar el paciente:", error);
    res.status(500).json({ error: "Error al actualizar el paciente" });
  }
};

// Eliminar un paciente existente
export const deletePaciente = async (req, res) => {
  const { id } = req.params;
  try {
    const paciente = await Paciente.findByPk(id);
    if (paciente) {
      await paciente.destroy();
      res.status(200).json({ message: "Paciente eliminado correctamente" });
    } else {
      res.status(404).json({ error: "Paciente no encontrado" });
    }
  } catch (error) {
    console.error("Error al eliminar el paciente:", error);
    res.status(500).json({ error: "Error al eliminar el paciente" });
  }
};
