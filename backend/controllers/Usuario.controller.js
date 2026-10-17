/** @format */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { Op } from "sequelize";
import sequelize from "../config/database.js";
import { Usuario } from "../models/Usuario.model.js";

const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura_myv_2026";

// Configuración de transporte de correos
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER?.trim(),
    pass: process.env.EMAIL_PASS?.replace(/\s+/g, ""),
  },
});

// Helper para obtener el usuario principal (odontólogo o primer usuario)
const obtenerUsuarioOperativo = async () => {
  let usuario = await Usuario.findOne({ where: { rol: "odontologo" } });
  if (!usuario) {
    usuario = await Usuario.findOne();
  }
  return usuario;
};

// 1. Login Maestro / Vincular Dispositivo con JWT de 5 días
export const loginMaestro = async (req, res) => {
  try {
    const rawNombreUsuario = req.body.nombre_usuario || req.body.usuario || "";
    const rawContraseña = req.body.contraseña || req.body.contrasenia || req.body.password || "";
    const nombre_usuario = rawNombreUsuario.trim();
    const contraseña = rawContraseña;

    // Normalizar req.body para que coincida exactamente con las propiedades estándar
    req.body.nombre_usuario = nombre_usuario;
    req.body.contraseña = contraseña;

    console.log("=== DEBUG LOGIN MAESTRO ===");
    console.log("1. req.body recibido:", req.body);
    const usuario = await Usuario.findOne({ where: { nombre_usuario: req.body.nombre_usuario } });
    console.log("2. Usuario encontrado en DB:", usuario ? usuario.toJSON() : "NO ENCONTRADO");
    if (usuario) {
      const match = await bcrypt.compare(req.body.contraseña, usuario.contraseña);
      console.log("3. Resultado bcrypt.compare:", match);
    }
    console.log("===========================");

    if (!usuario) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    const match = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!match) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, nombre: usuario.nombre_usuario, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: "5d" }
    );

    return res.status(200).json({
      status: "success",
      mensaje: "Dispositivo vinculado con éxito",
      token,
      expiraEn: "5d",
      usuario: { id: usuario.id_usuario, nombre: usuario.nombre_usuario, rol: usuario.rol },
    });
  } catch (error) {
    console.error("Error en loginMaestro:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// 2. Desbloqueo Diario con PIN de 4 dígitos
export const validarPin = async (req, res) => {
  try {
    const { pin } = req.body;
    const usuario = await obtenerUsuarioOperativo();
    if (!usuario || !usuario.pin) {
      return res.status(404).json({ mensaje: "No hay PIN configurado en el sistema" });
    }

    const match = await bcrypt.compare(pin, usuario.pin);
    if (!match) {
      return res.status(401).json({ mensaje: "PIN incorrecto" });
    }

    return res.status(200).json({
      status: "success",
      mensaje: "Acceso autorizado",
      desbloqueado: true,
    });
  } catch (error) {
    console.error("Error en validarPin:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// 3. Verificar Contraseña Maestra (para autorizar cambio o rescate de PIN)
export const verificarPassword = async (req, res) => {
  try {
    const { contraseña } = req.body;
    const usuario = await obtenerUsuarioOperativo();
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const match = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!match) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    return res.status(200).json({
      status: "success",
      mensaje: "Contraseña validada con éxito",
      autorizada: true,
    });
  } catch (error) {
    console.error("Error en verificarPassword:", error);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// 4. Cambiar/Recuperar PIN con validación de clave maestra previa
export const recuperarPin = async (req, res) => {
  try {
    const { contraseña, nuevo_pin } = req.body;
    const usuario = await obtenerUsuarioOperativo();
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    const match = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!match) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.pin = await bcrypt.hash(nuevo_pin, salt);
    await usuario.save();

    return res.status(200).json({
      status: "success",
      mensaje: "PIN actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error en recuperarPin:", error);
    return res.status(500).json({ mensaje: "Error interno al actualizar PIN" });
  }
};

// 5. Recuperación por Mail con Nodemailer
export const solicitarRecuperacionPassword = async (req, res) => {
  try {
    const emailLimpio = req.body.email?.trim().toLowerCase();

    if (!emailLimpio) {
      return res.status(400).json({ status: "error", mensaje: "El correo es obligatorio." });
    }

    const usuario = await Usuario.findOne({
      where: sequelize.where(
        sequelize.fn("LOWER", sequelize.col("email")),
        emailLimpio
      ),
    });

    // Mensaje genérico preventivo de seguridad si no existe el usuario
    if (!usuario) {
      console.log(`[SMTP] Correo no registrado en el sistema: ${emailLimpio}`);
      return res.status(200).json({
        status: "success",
        mensaje: "Si el correo coincide con una cuenta registrada, se enviarán las instrucciones.",
      });
    }

    const pinRecuperacion = crypto.randomInt(100000, 1000000).toString();
    usuario.reset_token = pinRecuperacion;
    usuario.reset_token_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos
    await usuario.save();

    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Tarjeta Principal -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); overflow: hidden; border: 1px solid #e2e8f0;">
          <!-- Encabezado con color de marca -->
          <tr>
            <td style="background-color: #0d9488; padding: 28px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">M&V Dental</h1>
              <p style="color: #ccfbf1; margin: 6px 0 0 0; font-size: 13px; font-weight: 500;">Sistema de Gestión Odontológica</p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 35px 35px 25px 35px;">
              <h2 style="color: #0f172a; margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Recuperación de Acceso</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                Hemos recibido una solicitud para restablecer tus credenciales de acceso al sistema. Utiliza el siguiente código de verificación para continuar:
              </p>

              <!-- Bloque del PIN de 6 dígitos -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 10px; padding: 18px 25px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f766e;">
                        ${pinRecuperacion}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Expiración -->
              <p style="color: #64748b; font-size: 13px; text-align: center; margin: 15px 0 25px 0;">
                ⏱️ Este código es válido durante <strong>15 minutos</strong>.
              </p>

              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 25px 0;">

              <!-- Nota de Seguridad -->
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                Si tú no solicitaste este cambio, puedes ignorar este mensaje; tus credenciales continuarán protegidas. Por motivos de seguridad, nunca compartas este código con terceros.
              </p>
            </td>
          </tr>

          <!-- Pie de página -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                © 2026 M&V Dental · Notificación de Seguridad
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    try {
      console.log(`[SMTP] Intentando enviar correo a: ${emailLimpio}`);
      const info = await transporter.sendMail({
        from: `"M&V Dental" <${process.env.EMAIL_USER?.trim()}>`,
        to: emailLimpio,
        subject: "Código de Recuperación - M&V Dental",
        text: `M&V Dental\n\nTu código de recuperación es: ${pinRecuperacion}\nEste código vence en 15 minutos.\nSi no lo solicitaste, desestima este mensaje.`,
        html: htmlContent,
      });
      console.log("[SMTP] Correo enviado exitosamente:", info.messageId);
    } catch (mailError) {
      console.error("[SMTP ERROR] Falló el despacho de Nodemailer:", mailError);
      return res.status(500).json({
        status: "error",
        mensaje: "Error al despachar el correo de recuperación.",
      });
    }

    return res.status(200).json({
      status: "success",
      mensaje: "Si el correo coincide con una cuenta registrada, se enviarán las instrucciones.",
    });
  } catch (error) {
    console.error("Error en solicitarRecuperacionPassword:", error);
    return res.status(500).json({ status: "error", mensaje: "Error al solicitar recuperación" });
  }
};

// 6. Restablecer Contraseña consumiendo el PIN de 6 dígitos
export const restablecerPassword = async (req, res) => {
  try {
    const rawCodigo = req.body.codigo || req.body.token || req.body.pin || "";
    const codigo = rawCodigo.toString().trim();
    const nueva_contraseña = req.body.nueva_contraseña || req.body.nuevaContrasenia || req.body.password;

    if (!codigo || codigo.length !== 6) {
      return res.status(400).json({ status: "error", mensaje: "El código debe tener exactamente 6 dígitos." });
    }

    if (!nueva_contraseña) {
      return res.status(400).json({ status: "error", mensaje: "La nueva contraseña es obligatoria." });
    }

    const usuario = await Usuario.findOne({
      where: {
        reset_token: codigo,
        reset_token_expires: { [Op.gt]: new Date() },
      },
    });

    if (!usuario) {
      return res.status(400).json({ status: "error", mensaje: "El código es inválido o ha expirado." });
    }

    const salt = await bcrypt.genSalt(10);
    usuario.contraseña = await bcrypt.hash(nueva_contraseña, salt);
    usuario.reset_token = null;
    usuario.reset_token_expires = null;
    await usuario.save();

    console.log(`[AUTH] Contraseña restablecida con éxito para usuario ID: ${usuario.id_usuario}`);

    return res.status(200).json({
      status: "success",
      mensaje: "Contraseña actualizada exitosamente. Inicie sesión con sus nuevas credenciales.",
    });
  } catch (error) {
    console.error("Error en restablecerPassword:", error);
    return res.status(500).json({ status: "error", mensaje: "Error al restablecer contraseña" });
  }
};

// 7. Refresco de Token de 5 días
export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ mensaje: "Token requerido" });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ mensaje: "Token expirado o inválido" });
      const nuevoToken = jwt.sign(
        { id: decoded.id, nombre: decoded.nombre, rol: decoded.rol },
        JWT_SECRET,
        { expiresIn: "5d" }
      );
      return res.status(200).json({
        status: "success",
        token: nuevoToken,
        expiraEn: "5d",
      });
    });
  } catch (error) {
    console.error("Error en refreshToken:", error);
    return res.status(500).json({ mensaje: "Error en refresco de token" });
  }
};

// 8. Crear / Registrar Usuario (Administrativo / Inicial)
export const createUsuario = async (req, res) => {
  try {
    const { nombre_usuario, contraseña, email, pin, rol } = req.body;

    const existe = await Usuario.findOne({ where: { nombre_usuario } });
    if (existe) {
      return res.status(400).json({ mensaje: "El nombre de usuario ya está registrado" });
    }

    if (email) {
      const existeEmail = await Usuario.findOne({ where: { email } });
      if (existeEmail) {
        return res.status(400).json({ mensaje: "El email ya está registrado" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(contraseña, salt);
    const hashPin = pin ? await bcrypt.hash(pin, salt) : null;

    const nuevoUsuario = await Usuario.create({
      nombre_usuario,
      contraseña: hashPassword,
      email,
      pin: hashPin,
      rol: rol || "odontologo",
    });

    return res.status(201).json({
      status: "success",
      mensaje: "Usuario creado exitosamente",
      data: {
        id_usuario: nuevoUsuario.id_usuario,
        nombre_usuario: nuevoUsuario.nombre_usuario,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      },
    });
  } catch (error) {
    console.error("Error en createUsuario:", error);
    return res.status(500).json({ mensaje: "Error al crear el usuario" });
  }
};
