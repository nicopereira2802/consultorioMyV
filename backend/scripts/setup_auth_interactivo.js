/** @format */

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Usuario } from "../models/Usuario.model.js";

const DEFAULT_EMAIL = "admin@consultorio.com";
const DEFAULT_PASSWORD = "Admin123!";
const DEFAULT_PIN = "1234";

async function main() {
  console.log("\n====================================================");
  console.log(" CONFIGURACIÓN INTERACTIVA DE ACCESO MAESTRO (DEV)  ");
  console.log("====================================================");
  console.log("Presione [Enter] en cualquier campo para usar el valor predeterminado.\n");

  const usarDefaultsDirecto =
    process.argv.includes("--defaults") || process.argv.includes("-y");

  let email = DEFAULT_EMAIL;
  let password = DEFAULT_PASSWORD;
  let pin = DEFAULT_PIN;

  let rl = null;
  if (!usarDefaultsDirecto) {
    if (input.isTTY) {
      try {
        rl = readline.createInterface({ input, output });

        // 1. Email de notificaciones / recuperación
        const respEmail = await rl.question(
          `1. Email de notificaciones/recuperación [${DEFAULT_EMAIL}]: `,
        );
        if (respEmail && respEmail.trim()) {
          email = respEmail.trim();
        }

        // 2. Contraseña Maestra
        const respPass = await rl.question(
          `2. Contraseña Maestra [${DEFAULT_PASSWORD}]: `,
        );
        if (respPass && respPass.trim()) {
          password = respPass.trim();
        }

        // 3. PIN rápido de 4 dígitos
        const respPin = await rl.question(
          `3. PIN rápido de 4 dígitos [${DEFAULT_PIN}]: `,
        );
        if (respPin && respPin.trim()) {
          pin = respPin.trim();
        }

        rl.close();
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Detalle captura stdin:", err);
        }
      }
    } else {
      // Modo no-TTY (piped stdin / scripts automáticos)
      try {
        const lines = [];
        const nonTtyRl = readline.createInterface({ input, crlfDelay: Infinity });
        for await (const line of nonTtyRl) {
          lines.push(line.trim());
          if (lines.length >= 3) break;
        }
        if (lines[0]) email = lines[0];
        if (lines[1]) password = lines[1];
        if (lines[2]) pin = lines[2];
      } catch {
        // En caso de stream vacío o error de tubería, se mantienen los defaults seguros
      }
    }
  } else {
    console.log(
      "Flag --defaults detectado. Aplicando valores predeterminados de desarrollo...",
    );
  }

  // Validación de seguridad para el PIN
  if (!/^\d{4}$/.test(pin)) {
    console.warn(
      `\n⚠️  El PIN ingresado ("${pin}") no tiene 4 dígitos numéricos. Se asignará el PIN seguro por defecto: ${DEFAULT_PIN}`,
    );
    pin = DEFAULT_PIN;
  }

  console.log("\n⏳ Conectando con la base de datos MySQL...");

  try {
    await sequelize.authenticate();
    console.log("✓ Conexión establecida con éxito.");

    console.log("⏳ Generando hashes seguros con bcrypt (10 salt rounds)...");
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash(pin, 10);

    // Buscar al usuario principal (priorizando rol: 'odontologo', luego 'admin' o primer usuario registrado)
    let usuario = await Usuario.findOne({ where: { rol: "odontologo" } });
    if (!usuario) {
      usuario =
        (await Usuario.findOne({ where: { rol: "admin" } })) ||
        (await Usuario.findOne());
    }

    if (usuario) {
      // Si otro usuario ya tenía asignado el mismo email, liberarlo para evitar error de clave única UNIQUE
      const usuarioDuplicadoEmail = await Usuario.findOne({
        where: {
          email,
          id_usuario: { [Op.ne]: usuario.id_usuario },
        },
      });
      if (usuarioDuplicadoEmail) {
        usuarioDuplicadoEmail.email = null;
        await usuarioDuplicadoEmail.save();
      }

      usuario.contraseña = hashedPassword;
      usuario.pin = hashedPin;
      usuario.email = email;
      if (usuario.intentos_pin_fallidos !== undefined) {
        usuario.intentos_pin_fallidos = 0;
      }
      await usuario.save();
      console.log(
        `✓ Usuario maestro "${usuario.nombre_usuario}" (ID: ${usuario.id_usuario}, Rol: ${usuario.rol}) actualizado con éxito.`,
      );
    } else {
      // Si la tabla estuviese vacía, crear el usuario odontólogo titular
      usuario = await Usuario.create({
        nombre_usuario: "Odontologo",
        contraseña: hashedPassword,
        pin: hashedPin,
        email,
        rol: "odontologo",
      });
      console.log(
        `✓ Usuario maestro titular "${usuario.nombre_usuario}" creado con éxito.`,
      );
    }

    // Sincronizar también la contraseña y PIN en usuario admin si existe en la BD local
    const adminUser = await Usuario.findOne({
      where: { rol: "admin", id_usuario: { [Op.ne]: usuario.id_usuario } },
    });
    if (adminUser) {
      adminUser.contraseña = hashedPassword;
      adminUser.pin = hashedPin;
      await adminUser.save();
      console.log(
        `✓ Contraseña y PIN sincronizados también para el usuario administrador "${adminUser.nombre_usuario}".`,
      );
    }

    console.log("\n====================================================");
    console.log(" ACCESO MAESTRO CONFIGURADO CORRECTAMENTE");
    console.log("====================================================");
    console.log(` Email de Notificaciones : ${email}`);
    console.log(` Contraseña Maestra      : ${password}`);
    console.log(` PIN de Desbloqueo       : ${pin}`);
    console.log("====================================================");
    console.log(" Ya podés iniciar el sistema con: npm run dev");
    console.log("====================================================\n");

    process.exit(0);
  } catch (error) {
    if (rl) {
      try {
        rl.close();
      } catch {
        // Ignorar
      }
    }
    console.error("\n❌ Error al configurar el acceso maestro:", error.message);
    console.log(
      "\n💡 Sugerencia: Verificá que el servicio de MySQL esté corriendo y tu archivo .env esté configurado correctamente.",
    );
    console.log(
      "   Variables requeridas: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD y DB_NAME.\n",
    );
    process.exit(1);
  }
}

main();
