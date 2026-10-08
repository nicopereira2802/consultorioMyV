import { Paciente, ObraSocial, PacienteObraSocial } from "../models/index.model.js";
import {
  validarTelefono,
  validarDni,
} from "../validations/Paciente.validation.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

// Include reutilizable para obras sociales con baja lógica y atributos requeridos
const includeObraSocialActivas = {
  model: ObraSocial,
  through: {
    attributes: ["nro_afiliado", "activo"],
    where: { activo: true },
  },
  required: false,
};

/**
 * Sincroniza las obras sociales de un paciente con soporte de revinculación y baja lógica.
 * No realiza eliminaciones físicas (DELETE) en paciente_obra_social.
 */
const sincronizarObrasSocialesPaciente = async (
  idPaciente,
  obrasSociales = [],
  transaction = null,
) => {
  const incoming = (Array.isArray(obrasSociales) ? obrasSociales : []).filter(
    (os) => os && Number(os.id_obra_social) > 1,
  );

  const incomingMap = new Map();
  for (const os of incoming) {
    const idOS = Number(os.id_obra_social);
    const nro = os.nro_afiliado ? String(os.nro_afiliado).trim() : null;
    incomingMap.set(idOS, nro);
  }

  // Buscar todos los registros existentes (tanto activo = true como activo = false)
  const existentes = await PacienteObraSocial.findAll({
    where: { id_paciente: idPaciente },
    transaction,
  });

  // 1. Revinculación / Actualización o Baja lógica
  for (const existente of existentes) {
    const idOS = Number(existente.id_obra_social);
    if (incomingMap.has(idOS)) {
      // Revinculación / Actualización: si ya existía en la base para ese paciente
      const nuevoNro = incomingMap.get(idOS);
      await existente.update(
        { activo: true, nro_afiliado: nuevoNro },
        { transaction },
      );
    } else {
      // Baja lógica: si existía en la base pero NO vino en el arreglo activo del frontend
      if (existente.activo) {
        await existente.update({ activo: false }, { transaction });
      }
    }
  }

  // 2. Nueva vinculación: si no existía previamente en la base
  for (const [idOS, nroAfiliado] of incomingMap.entries()) {
    const yaExistia = existentes.some((e) => Number(e.id_obra_social) === idOS);
    if (!yaExistia) {
      await PacienteObraSocial.create(
        {
          id_paciente: idPaciente,
          id_obra_social: idOS,
          nro_afiliado: nroAfiliado,
          activo: true,
        },
        { transaction },
      );
    }
  }
};

// Obtener todos los pacientes
export const getAllPacientes = async (req, res) => {
  try {
    // paginacion
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const sortField = req.query.sortField || "apellido";
    const sortOrder = req.query.sortOrder || "ASC";
    const where = {
      activo: true,
    };

    // Busqueda por nombre apellido dni telefono
    if (search.trim() !== "") {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { apellido: { [Op.like]: `%${search}%` } },
        { dni: { [Op.like]: `%${search}%` } },
        { telefono: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: pacientes } = await Paciente.findAndCountAll({
      where,
      limit,
      offset,
      include: [includeObraSocialActivas],
      order: [[sortField, sortOrder]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      data: pacientes,
      meta: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error al obtener los pacientes:", error);
    res.status(500).json({
      status: "error",
      message: "Error al obtener los pacientes",
      error: error.message,
    });
  }
};

// Obtener un paciente por su ID
export const getPacienteById = async (req, res) => {
  try {
    const id = req.params.id || req.paciente?.id_paciente;
    const paciente = await Paciente.findByPk(id, {
      include: [includeObraSocialActivas],
    });

    if (!paciente) {
      return res.status(404).json({ error: "Error al obtener el paciente" });
    }

    res.status(200).json({
      status: "success",
      data: paciente,
    });
  } catch (error) {
    console.error("Error al obtener el paciente:", error);
    res.status(500).json({ error: "Error al obtener el paciente" });
  }
};

// Crear un nuevo paciente
export const createPaciente = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      nombre,
      apellido,
      fecha_nacimiento,
      dni,
      telefono,
      domicilio,
      direccion,
      id_obra_social,
      nro_afiliado,
      obras_sociales,
    } = req.body;

    const cleanDni =
      dni && String(dni).trim() !== "" ? String(dni).trim() : null;

    if (cleanDni) {
      const pacienteExistente = await Paciente.findOne({
        where: { dni: cleanDni },
        transaction: t,
      });

      if (pacienteExistente) {
        await t.rollback();
        const estaDadoDeBaja =
          pacienteExistente.activo === false ||
          pacienteExistente.activo === 0 ||
          (pacienteExistente.deletedAt !== null && pacienteExistente.deletedAt !== undefined);

        if (estaDadoDeBaja) {
          return res.status(409).json({
            puedeReactivar: true,
            id_paciente: pacienteExistente.id_paciente,
            nombre: pacienteExistente.nombre,
            apellido: pacienteExistente.apellido,
            message:
              "El paciente se encuentra registrado en el historial como inactivo.",
          });
        } else {
          return res.status(400).json({
            status: "error",
            message: "Ya existe un paciente activo registrado con este DNI.",
          });
        }
      }
    }

    const cleanTelefono = String(telefono || "").trim();
    if (cleanTelefono && cleanTelefono !== "S/D") {
      const telefonoDuplicado = await validarTelefono(cleanTelefono);
      if (!telefonoDuplicado) {
        await t.rollback();
        return res.status(400).json({
          status: "error",
          message: "El telefono esta duplicado. El paciente ya existe",
        });
      }
    }

    const cleanDomicilio =
      (domicilio && String(domicilio).trim()) ||
      (direccion && String(direccion).trim()) ||
      null;
    const cleanFechaNacimiento = fecha_nacimiento ? fecha_nacimiento : null;

    const newPaciente = await Paciente.create(
      {
        nombre: String(nombre).trim(),
        apellido: String(apellido).trim(),
        fecha_nacimiento: cleanFechaNacimiento,
        dni: cleanDni,
        telefono: cleanTelefono,
        domicilio: cleanDomicilio,
        activo: true,
      },
      { transaction: t }
    );

    // Sincronizar obras sociales (admite arreglo o campo singular heredado)
    let listaOS = [];
    if (Array.isArray(obras_sociales)) {
      listaOS = obras_sociales;
    } else if (id_obra_social && Number(id_obra_social) > 1) {
      listaOS = [{ id_obra_social: Number(id_obra_social), nro_afiliado }];
    }

    if (listaOS.length > 0) {
      await sincronizarObrasSocialesPaciente(newPaciente.id_paciente, listaOS, t);
    }

    await t.commit();

    const pacienteCompleto = await Paciente.findByPk(newPaciente.id_paciente, {
      include: [includeObraSocialActivas],
    });

    res.status(201).json({
      status: "success",
      data: pacienteCompleto,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al crear el paciente:", error);
    res.status(500).json({ error: "Error al crear el paciente" });
  }
};

// Reactivar un paciente dado de baja lógica
export const reactivarPaciente = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const pacienteId = id || req.body?.id_paciente;

    const paciente = await Paciente.findByPk(pacienteId, {
      include: [includeObraSocialActivas],
      transaction: t,
    });

    if (!paciente) {
      await t.rollback();
      return res.status(404).json({
        status: "error",
        message: `No se encontró el paciente con ID ${pacienteId}`,
      });
    }

    // Extraer datos para actualización
    const {
      nombre,
      apellido,
      fecha_nacimiento,
      dni,
      telefono,
      domicilio,
      direccion,
      id_obra_social,
      nro_afiliado,
      obras_sociales,
    } = req.body;

    const cleanDni =
      dni !== undefined
        ? dni && String(dni).trim() !== ""
          ? String(dni).trim()
          : null
        : paciente.dni;

    const cleanTelefono =
      telefono !== undefined
        ? String(telefono).trim()
        : paciente.telefono;

    const cleanDomicilio =
      domicilio !== undefined
        ? domicilio
          ? String(domicilio).trim()
          : null
        : direccion !== undefined
        ? direccion
          ? String(direccion).trim()
          : null
        : paciente.domicilio;

    // Actualizar registro reactivando su estado (activo: true)
    await paciente.update(
      {
        ...req.body,
        nombre: nombre ? String(nombre).trim() : paciente.nombre,
        apellido: apellido ? String(apellido).trim() : paciente.apellido,
        fecha_nacimiento:
          fecha_nacimiento !== undefined
            ? fecha_nacimiento || null
            : paciente.fecha_nacimiento,
        dni: cleanDni,
        telefono: cleanTelefono,
        domicilio: cleanDomicilio,
        activo: true,
      },
      { transaction: t }
    );

    // Sincronizar obras sociales
    if (obras_sociales !== undefined) {
      await sincronizarObrasSocialesPaciente(paciente.id_paciente, obras_sociales, t);
    } else if (id_obra_social !== undefined) {
      const listaOS = Number(id_obra_social) > 1
        ? [{ id_obra_social: Number(id_obra_social), nro_afiliado }]
        : [];
      await sincronizarObrasSocialesPaciente(paciente.id_paciente, listaOS, t);
    }

    await t.commit();

    const pacienteReactivado = await Paciente.findByPk(paciente.id_paciente, {
      include: [includeObraSocialActivas],
    });

    res.status(200).json({
      status: "success",
      message: "Paciente reactivado con éxito",
      paciente: pacienteReactivado,
      data: pacienteReactivado,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al reactivar el paciente:", error);
    res.status(500).json({
      status: "error",
      message: "Error al reactivar el paciente",
      error: error.message,
    });
  }
};

// Actualizar un paciente existente
export const updatePaciente = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      nombre,
      apellido,
      fecha_nacimiento,
      dni,
      telefono,
      domicilio,
      direccion,
      id_obra_social,
      nro_afiliado,
      obras_sociales,
    } = req.body;

    const paciente = req.paciente;

    if (telefono) {
      const cleanTelefono = String(telefono).trim();
      const telefonoDuplicado = await validarTelefono(
        cleanTelefono,
        paciente.id_paciente,
      );

      if (!telefonoDuplicado) {
        await t.rollback();
        return res.status(400).json({
          status: "error",
          message: "Telefono duplicado. El paciente ya existe",
        });
      }
    }

    let cleanDni = undefined;
    if (dni !== undefined) {
      cleanDni = dni && String(dni).trim() !== "" ? String(dni).trim() : null;
      if (cleanDni) {
        const dniDuplicado = await validarDni(cleanDni, paciente.id_paciente);
        if (!dniDuplicado) {
          await t.rollback();
          return res.status(400).json({
            status: "error",
            message: "El dni esta duplicado. El paciente ya existe",
          });
        }
      }
    }

    const cleanDomicilio =
      domicilio !== undefined
        ? domicilio
          ? String(domicilio).trim()
          : null
        : direccion !== undefined
        ? direccion
          ? String(direccion).trim()
          : null
        : paciente.domicilio;

    await paciente.update(
      {
        nombre: nombre ? String(nombre).trim() : paciente.nombre,
        apellido: apellido ? String(apellido).trim() : paciente.apellido,
        fecha_nacimiento:
          fecha_nacimiento !== undefined
            ? fecha_nacimiento || null
            : paciente.fecha_nacimiento,
        dni: cleanDni !== undefined ? cleanDni : paciente.dni,
        telefono: telefono ? String(telefono).trim() : paciente.telefono,
        domicilio: cleanDomicilio,
      },
      { transaction: t }
    );

    if (obras_sociales !== undefined) {
      await sincronizarObrasSocialesPaciente(paciente.id_paciente, obras_sociales, t);
    } else if (id_obra_social !== undefined) {
      const listaOS = Number(id_obra_social) > 1
        ? [{ id_obra_social: Number(id_obra_social), nro_afiliado }]
        : [];
      await sincronizarObrasSocialesPaciente(paciente.id_paciente, listaOS, t);
    }

    await t.commit();

    const pacienteActualizado = await Paciente.findByPk(paciente.id_paciente, {
      include: [includeObraSocialActivas],
    });

    res.status(200).json({
      status: "success",
      data: pacienteActualizado,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error al actualizar el paciente:", error);
    res.status(500).json({ error: "Error al actualizar el paciente" });
  }
};

// Eliminar un paciente existente
export const deletePaciente = async (req, res) => {
  try {
    const paciente = req.paciente;

    await paciente.update({
      activo: false,
    });

    res.status(200).json({ message: "Paciente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el paciente:", error);
    res.status(500).json({ error: "Error al eliminar el paciente" });
  }
};

// Obtener historial clínico (turnos) de un paciente
export const getHistorialPaciente = async (req, res) => {
  try {
    const id = req.params.id;
    const { Turno, EstadoTurno, Practica } = await import("../models/index.model.js");
    const turnos = await Turno.findAll({
      where: { id_paciente: id },
      include: [{ model: EstadoTurno }, { model: Practica }],
      order: [["fecha_hora_inicio", "DESC"]],
    });
    res.status(200).json({
      status: "success",
      data: turnos,
    });
  } catch (error) {
    console.error("Error al obtener historial del paciente:", error);
    res.status(500).json({ error: "Error al obtener historial" });
  }
};
