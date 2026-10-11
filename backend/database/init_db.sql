-- SCRIPT DE INICIALIZACIÓN OFICIAL (DER 12 ENTIDADES): consultorio_myv

CREATE DATABASE IF NOT EXISTS consultorio_myv;
USE consultorio_myv;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. TABLA: usuario
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nombre_usuario VARCHAR(100) NOT NULL UNIQUE,
    contraseña VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'odontologo') NOT NULL
);

-- 2. TABLA: paciente
CREATE TABLE IF NOT EXISTS paciente (
    id_paciente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    fecha_nacimiento DATE,
    telefono VARCHAR(50),
    domicilio VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE
);

-- 3. TABLA: obra_social
CREATE TABLE IF NOT EXISTS obra_social (
    id_obra_social INT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

-- 4. TABLA: paciente_obra_social
CREATE TABLE IF NOT EXISTS paciente_obra_social (
    id_paciente INT NOT NULL,
    id_obra_social INT NOT NULL,
    nro_afiliado VARCHAR(100),
    PRIMARY KEY (id_paciente, id_obra_social),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE CASCADE,
    FOREIGN KEY (id_obra_social) REFERENCES obra_social(id_obra_social) ON DELETE CASCADE
);

-- 5. TABLA: estado_turno
CREATE TABLE IF NOT EXISTS estado_turno (
    id_estado INT PRIMARY KEY,
    estado ENUM('Programado', 'Reprogramado', 'Cancelado', 'Atendido', 'Inasistente') NOT NULL UNIQUE
);

-- 6. TABLA: turno (turnos)
CREATE TABLE IF NOT EXISTS turno (
    id_turno INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente INT NOT NULL,
    id_estado INT NOT NULL,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NOT NULL,
    precio_final DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notas_consulta VARCHAR(255) NULL,
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE CASCADE,
    FOREIGN KEY (id_estado) REFERENCES estado_turno(id_estado)
);

-- 7. TABLA: historial_estado_turno
CREATE TABLE IF NOT EXISTS historial_estado_turno (
    id_historial INT PRIMARY KEY AUTO_INCREMENT,
    id_turno INT NOT NULL,
    id_estado INT NOT NULL,
    fecha_hora_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descripcion VARCHAR(255) NULL,
    FOREIGN KEY (id_turno) REFERENCES turno(id_turno) ON DELETE CASCADE,
    FOREIGN KEY (id_estado) REFERENCES estado_turno(id_estado)
);

-- 8. TABLA: practica
CREATE TABLE IF NOT EXISTS practica (
    id_practica INT PRIMARY KEY AUTO_INCREMENT,
    codigo_nomenclador VARCHAR(20),
    nombre_nomenclador VARCHAR(255) NOT NULL,
    nombre_referencia VARCHAR(255),
    especialidad VARCHAR(100),
    precio_referencia DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE
);

-- 9. TABLA: practica_turno
CREATE TABLE IF NOT EXISTS practica_turno (
    id_practica_turno INT AUTO_INCREMENT PRIMARY KEY,
    id_turno INT NOT NULL,
    id_practica INT NOT NULL,
    precio_aplicado DECIMAL(10, 2) NULL,
    id_obra_social INT NULL,
    CONSTRAINT fk_pt_turno FOREIGN KEY (id_turno) REFERENCES turno(id_turno) ON DELETE CASCADE,
    CONSTRAINT fk_pt_practica FOREIGN KEY (id_practica) REFERENCES practica(id_practica) ON DELETE CASCADE,
    CONSTRAINT fk_pt_obrasocial FOREIGN KEY (id_obra_social) REFERENCES obra_social(id_obra_social) ON DELETE SET NULL
);

-- 10. TABLA: obra_social_turno
CREATE TABLE IF NOT EXISTS obra_social_turno (
    id_obra_social INT NOT NULL,
    id_turno INT NOT NULL,
    id_practica INT NULL,
    PRIMARY KEY (id_obra_social, id_turno),
    FOREIGN KEY (id_obra_social) REFERENCES obra_social(id_obra_social) ON DELETE CASCADE,
    FOREIGN KEY (id_turno) REFERENCES turno(id_turno) ON DELETE CASCADE,
    FOREIGN KEY (id_practica) REFERENCES practica(id_practica) ON DELETE SET NULL
);

-- 11. TABLA: cobro
CREATE TABLE IF NOT EXISTS cobro (
    id_cobro INT PRIMARY KEY AUTO_INCREMENT,
    id_turno INT NULL,
    id_paciente INT NOT NULL,
    monto_a_cobrar DECIMAL(10, 2) NOT NULL,
    cant_cuotas INT NOT NULL DEFAULT 1,
    fecha_emision DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_turno) REFERENCES turno(id_turno) ON DELETE SET NULL,
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE CASCADE
);

-- 12. TABLA: cuota
CREATE TABLE IF NOT EXISTS cuota (
    id_cuota INT PRIMARY KEY AUTO_INCREMENT,
    id_cobro INT NOT NULL,
    nro_cuota INT NOT NULL,
    monto_cuota DECIMAL(10, 2) NOT NULL,
    monto_cobrado DECIMAL(10, 2) DEFAULT 0.00,
    fecha_vencimiento DATE NOT NULL,
    fecha_cobro DATETIME NULL,
    metodo_pago ENUM('Efectivo', 'Transferencia', 'Tarjeta', 'Otro') NULL,
    estado ENUM('Pendiente', 'Pagada', 'Parcialmente pagada') NOT NULL DEFAULT 'Pendiente',
    activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (id_cobro) REFERENCES cobro(id_cobro) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------- SEEDERS ----------------------------

INSERT INTO estado_turno (id_estado, estado) VALUES
(1, 'Programado'),
(2, 'Reprogramado'),
(3, 'Cancelado'),
(4, 'Atendido'),
(5, 'Inasistente')
ON DUPLICATE KEY UPDATE estado = VALUES(estado);

INSERT INTO obra_social (id_obra_social, nombre, activo) VALUES
(1, 'Particular', TRUE),
(2, 'OSDE', TRUE),
(3, 'Swiss Medical', TRUE),
(4, 'Apross', TRUE),
(5, 'PAMI', TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), activo = VALUES(activo);

INSERT INTO usuario (id_usuario, nombre_usuario, contraseña, rol) VALUES
(1, 'admin', '$2b$10$abcdefghijklmnopqrstuv', 'admin'),
(2, 'odontologo', '$2b$10$abcdefghijklmnopqrstuv', 'odontologo')
ON DUPLICATE KEY UPDATE rol = VALUES(rol);

INSERT INTO paciente (id_paciente, nombre, apellido, dni, fecha_nacimiento, telefono, domicilio, activo) VALUES
(1, 'Juan', 'Pérez', '38450123', '1995-04-12', '3514567890', 'Av. Colón 1234, Córdoba', TRUE),
(2, 'María', 'González', '40123987', '1997-09-25', '3516781234', 'Bv. San Juan 567, Córdoba', TRUE),
(3, 'Lucas', 'Rodríguez', '35678234', '1991-01-18', '3519876543', 'Chacabuco 890, Córdoba', TRUE),
(4, 'Lucía', 'Martínez', '42567890', '2000-06-30', '3513214567', 'Estrada 432, Córdoba', TRUE)
ON DUPLICATE KEY UPDATE dni = VALUES(dni);

INSERT INTO paciente_obra_social (id_paciente, id_obra_social, nro_afiliado) VALUES
(1, 2, 'OSDE-987654321'),
(2, 3, 'SM-44556677'),
(3, 4, 'APR-11223344')
ON DUPLICATE KEY UPDATE nro_afiliado = VALUES(nro_afiliado);

INSERT INTO practica (id_practica, codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia, activo) VALUES
(1, '01.01', 'Consulta Odontológica General', 'Examen bucal y diagnóstico', 'Odontología General', 15000.00, TRUE),
(2, '02.01', 'Limpieza y Tartrectomía', 'Limpieza con ultrasonido', 'Periodoncia', 25000.00, TRUE),
(3, '03.02', 'Restauración Estética con Resina', 'Arreglo de caries simple', 'Operatoria Dental', 32000.00, TRUE),
(4, '05.01', 'Extracción Simple', 'Extracción dental', 'Cirugía', 30000.00, TRUE),
(5, '08.01', 'Tratamiento de Conducto Unirradicular', 'Endodoncia simple', 'Endodoncia', 55000.00, TRUE)
ON DUPLICATE KEY UPDATE codigo_nomenclador = VALUES(codigo_nomenclador);