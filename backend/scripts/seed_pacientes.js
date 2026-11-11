/** @format */
// Carga un lote inicial de 10 pacientes de prueba con datos realistas y distribuidos en obras sociales.
//
// Uso (desde la carpeta backend):
//   node scripts/seed_pacientes.js              -> agrega los que faltan (no toca los existentes)
//   node scripts/seed_pacientes.js --actualizar -> actualiza datos de los que ya existen con el mismo DNI
//
// - Usa la conexión configurada en Sequelize (y variables de entorno .env).
// - Identifica cada paciente por su DNI: no duplica registros.
// - Carga dinámicamente las obras sociales (OSDE, Apross, Swiss Medical, Particular).

import dotenv from "dotenv";
import sequelize from "../config/database.js";
import { Paciente, ObraSocial, PacienteObraSocial } from "../models/index.model.js";

dotenv.config();

const ACTUALIZAR = process.argv.includes("--actualizar");

const PACIENTES = [
  {
    nombre: "Carlos",
    apellido: "Benítez",
    dni: "34120891",
    fecha_nacimiento: "1988-11-14",
    telefono: "351-5123401",
    domicilio: "Av. Colón 1234, Córdoba",
    obra_social: "OSDE",
    nro_afiliado: "OSDE-34120891/01",
  },
  {
    nombre: "Lucía",
    apellido: "Fernández",
    dni: "41258902",
    fecha_nacimiento: "1998-05-22",
    telefono: "351-6234502",
    domicilio: "Bv. Chacabuco 456, Córdoba",
    obra_social: "Apross",
    nro_afiliado: "APR-41258902-3",
  },
  {
    nombre: "Matías",
    apellido: "Romero",
    dni: "28456123",
    fecha_nacimiento: "1980-09-10",
    telefono: "351-7345603",
    domicilio: "San Jerónimo 789, Córdoba",
    obra_social: "Particular",
    nro_afiliado: null,
  },
  {
    nombre: "Florencia",
    apellido: "Gómez",
    dni: "43109845",
    fecha_nacimiento: "2001-03-18",
    telefono: "351-8456704",
    domicilio: "Av. General Paz 890, Córdoba",
    obra_social: "Swiss Medical",
    nro_afiliado: "SM-43109845",
  },
  {
    nombre: "Esteban",
    apellido: "Morales",
    dni: "31789456",
    fecha_nacimiento: "1985-07-30",
    telefono: "351-9567805",
    domicilio: "27 de Abril 345, Córdoba",
    obra_social: "Apross",
    nro_afiliado: "APR-31789456-1",
  },
  {
    nombre: "Camila",
    apellido: "Pereyra",
    dni: "39542013",
    fecha_nacimiento: "1996-01-12",
    telefono: "351-4678906",
    domicilio: "Estrada 230, Córdoba",
    obra_social: "Particular",
    nro_afiliado: null,
  },
  {
    nombre: "Joaquín",
    apellido: "Álvarez",
    dni: "36874102",
    fecha_nacimiento: "1992-10-05",
    telefono: "351-5789017",
    domicilio: "Duarte Quirós 1560, Córdoba",
    obra_social: "OSDE",
    nro_afiliado: "OSDE-36874102/02",
  },
  {
    nombre: "Mariana",
    apellido: "Domínguez",
    dni: "25987412",
    fecha_nacimiento: "1977-04-19",
    telefono: "351-6890128",
    domicilio: "Mariano Fragueiro 412, Córdoba",
    obra_social: "Swiss Medical",
    nro_afiliado: "SM-25987412",
  },
  {
    nombre: "Tomás",
    apellido: "Herrera",
    dni: "45120398",
    fecha_nacimiento: "2003-12-04",
    telefono: "351-7901239",
    domicilio: "Av. Vélez Sarsfield 678, Córdoba",
    obra_social: "Apross",
    nro_afiliado: "APR-45120398-0",
  },
  {
    nombre: "Paula",
    apellido: "Rossi",
    dni: "38234567",
    fecha_nacimiento: "1994-08-25",
    telefono: "351-8012340",
    domicilio: "Rondeau 543, Córdoba",
    obra_social: "Particular",
    nro_afiliado: null,
  },
];

async function seedPacientes() {
  const dbName = sequelize.config.database || process.env.DB_NAME || "consultorio_myv";

  try {
    await sequelize.authenticate();
    console.log(`Conectado a la base '${dbName}'. Pacientes a procesar: ${PACIENTES.length}`);

    // Asegurar y cargar obras sociales dinámicamente
    const obrasRequeridas = ["Particular", "OSDE", "Swiss Medical", "Apross"];
    for (const nombreOS of obrasRequeridas) {
      await ObraSocial.findOrCreate({
        where: { nombre: nombreOS },
        defaults: { nombre: nombreOS, activo: true },
      });
    }

    const obrasSociales = await ObraSocial.findAll();
    const osMap = new Map();
    for (const os of obrasSociales) {
      osMap.set(os.nombre.toLowerCase().trim(), os.id_obra_social);
    }

    let agregadas = 0;
    let actualizadas = 0;
    let salteadas = 0;

    for (const p of PACIENTES) {
      const existente = await Paciente.findOne({
        where: { dni: p.dni },
      });

      const osId = osMap.get(p.obra_social.toLowerCase().trim()) || osMap.get("particular");

      if (existente) {
        if (ACTUALIZAR) {
          await existente.update({
            nombre: p.nombre,
            apellido: p.apellido,
            fecha_nacimiento: p.fecha_nacimiento,
            telefono: p.telefono,
            domicilio: p.domicilio,
            activo: true,
          });

          // Actualizar o crear la relación de obra social
          const relacionOS = await PacienteObraSocial.findOne({
            where: { id_paciente: existente.id_paciente },
          });

          if (relacionOS) {
            await relacionOS.update({
              id_obra_social: osId,
              nro_afiliado: p.nro_afiliado || null,
              activo: true,
            });
          } else if (osId) {
            await PacienteObraSocial.create({
              id_paciente: existente.id_paciente,
              id_obra_social: osId,
              nro_afiliado: p.nro_afiliado || null,
              activo: true,
            });
          }

          console.log(`  - Actualizado: ${p.nombre} ${p.apellido} (DNI: ${p.dni})`);
          actualizadas++;
        } else {
          console.log(`  - Ya existe, se saltea: ${p.nombre} ${p.apellido} (DNI: ${p.dni})`);
          salteadas++;
        }
        continue;
      }

      // Crear nuevo paciente
      const nuevoPaciente = await Paciente.create({
        nombre: p.nombre,
        apellido: p.apellido,
        dni: p.dni,
        fecha_nacimiento: p.fecha_nacimiento,
        telefono: p.telefono,
        domicilio: p.domicilio,
        activo: true,
      });

      // Crear relación de obra social
      if (osId) {
        await PacienteObraSocial.create({
          id_paciente: nuevoPaciente.id_paciente,
          id_obra_social: osId,
          nro_afiliado: p.nro_afiliado || null,
          activo: true,
        });
      }

      console.log(`  - Insertado: ${p.nombre} ${p.apellido} (${p.obra_social})`);
      agregadas++;
    }

    console.log(
      `\nListo. Agregados: ${agregadas}. Actualizados: ${actualizadas}. Salteados por existir: ${salteadas}.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Error al cargar los pacientes:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedPacientes();
