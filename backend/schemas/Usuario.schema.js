/** @format */

import { z } from "zod";

const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
const rolesValidos = ["admin", "odontologo"];

export const createUsuarioSchema = z.object({
  nombre_usuario: z
    .string({ required_error: "El nombre de usuario es obligatorio" })
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(50, "Máximo 50 caracteres")
    .regex(regex, "Solo letras y espacios"),
  contraseña: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(8, "Mínimo 8 caracteres")
    .max(100)
    .regex(/[A-Z]/, "Debe contener una mayúscula")
    .regex(/[a-z]/, "Debe contener una minúscula")
    .regex(/[0-9]/, "Debe contener un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener un carácter especial"),
  email: z
    .string({ required_error: "El correo es obligatorio" })
    .trim()
    .email("Formato de correo inválido"),
  pin: z
    .string({ required_error: "El PIN es obligatorio" })
    .length(4, "El PIN debe tener exactamente 4 dígitos")
    .regex(/^\d{4}$/, "El PIN solo puede contener dígitos numéricos"),
  rol: z.enum(rolesValidos).optional(),
});

export const updateUsuarioSchema = createUsuarioSchema.partial();

// Esquemas específicos para las rutas:
export const loginMaestroSchema = z
  .object({
    nombre_usuario: z.string().trim().optional(),
    usuario: z.string().trim().optional(),
    contraseña: z.string().optional(),
    contrasenia: z.string().optional(),
    password: z.string().optional(),
  })
  .refine((data) => Boolean((data.nombre_usuario && data.nombre_usuario.trim()) || (data.usuario && data.usuario.trim())), {
    message: "El usuario es obligatorio",
    path: ["nombre_usuario"],
  })
  .refine((data) => Boolean(data.contraseña || data.contrasenia || data.password), {
    message: "La contraseña es obligatoria",
    path: ["contraseña"],
  })
  .transform((data) => ({
    nombre_usuario: (data.nombre_usuario || data.usuario).trim(),
    contraseña: data.contraseña || data.contrasenia || data.password,
  }));

export const validarPinSchema = z.object({
  pin: z.string({ required_error: "El PIN es obligatorio" }).length(4).regex(/^\d{4}$/),
});

export const verificarPasswordSchema = z
  .object({
    contraseña: z.string().optional(),
    contrasenia: z.string().optional(),
    password: z.string().optional(),
  })
  .refine((data) => Boolean(data.contraseña || data.contrasenia || data.password), {
    message: "La contraseña es obligatoria",
    path: ["contraseña"],
  })
  .transform((data) => ({
    contraseña: data.contraseña || data.contrasenia || data.password,
  }));

export const recuperarPinSchema = z
  .object({
    contraseña: z.string().optional(),
    contrasenia: z.string().optional(),
    password: z.string().optional(),
    nuevo_pin: z.string().length(4).regex(/^\d{4}$/).optional(),
    pin: z.string().length(4).regex(/^\d{4}$/).optional(),
  })
  .refine((data) => Boolean(data.contraseña || data.contrasenia || data.password), {
    message: "La contraseña maestra es obligatoria",
    path: ["contraseña"],
  })
  .refine((data) => Boolean(data.nuevo_pin || data.pin), {
    message: "El nuevo PIN es obligatorio",
    path: ["nuevo_pin"],
  })
  .transform((data) => ({
    contraseña: data.contraseña || data.contrasenia || data.password,
    nuevo_pin: data.nuevo_pin || data.pin,
  }));

export const recuperarPasswordSchema = z.object({
  email: z.string({ required_error: "El correo es obligatorio" }).trim().email("Formato de email inválido"),
});

export const restablecerPasswordSchema = z
  .object({
    codigo: z.string().optional(),
    token: z.string().optional(),
    nueva_contraseña: z
      .string({ required_error: "La nueva contraseña es obligatoria" })
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número")
      .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  })
  .refine((data) => {
    const cod = data.codigo || data.token;
    return typeof cod === "string" && /^\d{6}$/.test(cod.trim());
  }, {
    message: "El código debe tener exactamente 6 dígitos numéricos",
    path: ["codigo"],
  })
  .transform((data) => {
    const cod = (data.codigo || data.token).trim();
    return {
      codigo: cod,
      token: cod,
      nueva_contraseña: data.nueva_contraseña,
    };
  });
