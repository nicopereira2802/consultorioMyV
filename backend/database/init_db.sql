-- ==========================================================
-- SCRIPT DE INICIALIZACIÓN: consultorio_myv
-- ==========================================================

DROP DATABASE IF EXISTS consultorio_myv;
CREATE DATABASE consultorio_myv CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE consultorio_myv;

-- 1. TABLA: ESTADO_TURNO
CREATE TABLE estado_turno (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    estado ENUM("Programado", "Reprogramado", "Cancelado", "Atendido", "Inasistente") NOT NULL DEFAULT "Programado",
) ENGINE=InnoDB;

-- 2. TABLA: OBRA_SOCIAL
CREATE TABLE obra_social (
    id_obra_social INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- 3. TABLA: PACIENTE
CREATE TABLE paciente (
    id_paciente INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) UNIQUE,
    fecha_nacimiento DATE,
    telefono VARCHAR(30) NOT NULL,
    domicilio VARCHAR(200),
    activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- 4. TABLA INTERMEDIA: PACIENTE_OBRA_SOCIAL
CREATE TABLE paciente_obra_social (
    id_paciente INT NOT NULL,
    id_obra_social INT NOT NULL,
    nro_afiliado VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_paciente, id_obra_social),
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE CASCADE,
    FOREIGN KEY (id_obra_social) REFERENCES obra_social(id_obra_social) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. TABLA: PRACTICA
CREATE TABLE practica (
    id_practica INT AUTO_INCREMENT PRIMARY KEY,
    codigo_nomenclador VARCHAR(50) NOT NULL,
    nombre_nomenclador VARCHAR(150) NOT NULL,
    nombre_referencia VARCHAR(150) NOT NULL,
    especialidad VARCHAR(100) NOT NULL,
    precio_referencia DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    activo BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- 6. TABLA: TURNO
CREATE TABLE turno (
    id_turno INT AUTO_INCREMENT PRIMARY KEY,
    id_paciente INT NOT NULL,
    id_estado INT NOT NULL,
    fecha_hora_inicio DATETIME NOT NULL,
    fecha_hora_fin DATETIME NOT NULL,
    precio_final DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notas_consulta TEXT NULL,
    FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente) ON DELETE RESTRICT,
    FOREIGN KEY (id_estado) REFERENCES estado_turno(id_estado) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. TABLA INTERMEDIA: TURNO_PRACTICA
CREATE TABLE turno_practica (
    id_turno INT NOT NULL,
    id_practica INT NOT NULL,
    PRIMARY KEY (id_turno, id_practica),
    FOREIGN KEY (id_turno) REFERENCES turno(id_turno) ON DELETE CASCADE,
    FOREIGN KEY (id_practica) REFERENCES practica(id_practica) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ==========================================================
-- CARGA DE DATOS DE PRUEBA (SEEDERS)
-- ==========================================================

INSERT INTO estado_turno (id_estado, nombre) VALUES
(1, 'Programado'),
(2, 'Reprogramado'),
(3, 'Cancelado'),
(4, 'Atendido'),
(5, 'Inasistente');

INSERT INTO obra_social (id_obra_social, nombre, activo) VALUES
(1, 'Particular', TRUE),
(2, 'OSDE', TRUE),
(3, 'Swiss Medical', TRUE),
(4, 'Apross', TRUE),
(5, 'PAMI', TRUE);

INSERT INTO paciente (id_paciente, nombre, apellido, dni, fecha_nacimiento, telefono, domicilio, activo) VALUES
(1, 'Juan', 'Pérez', '38450123', '1995-04-12', '3514567890', 'Av. Colón 1234, Córdoba', TRUE),
(2, 'María', 'González', '40123987', '1997-09-25', '3516781234', 'Bv. San Juan 567, Córdoba', TRUE),
(3, 'Lucas', 'Rodríguez', '35678234', '1991-01-18', '3519876543', 'Chacabuco 890, Córdoba', TRUE),
(4, 'Lucía', 'Martínez', '42567890', '2000-06-30', '3513214567', 'Estrada 432, Córdoba', TRUE);

INSERT INTO paciente_obra_social (id_paciente, id_obra_social, nro_afiliado) VALUES
(1, 2, 'OSDE-987654321'),
(2, 3, 'SM-44556677'),
(3, 4, 'APR-11223344');

INSERT INTO practica (id_practica, codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia, activo) VALUES
(1, '01.01', 'Consulta Odontológica General', 'Examen bucal y diagnóstico', 'Odontología General', 15000.00, TRUE),
(2, '02.01', 'Limpieza y Tartrectomía', 'Limpieza con ultrasonido', 'Periodoncia', 25000.00, TRUE),
(3, '03.02', 'Restauración Estética con Resina', 'Arreglo de caries simple', 'Operatoria Dental', 32000.00, TRUE),
(4, '05.01', 'Extracción Simple', 'Extracción dental', 'Cirugía', 30000.00, TRUE),
(5, '08.01', 'Tratamiento de Conducto Unirradicular', 'Endodoncia simple', 'Endodoncia', 55000.00, TRUE);

INSERT INTO turno (id_turno, id_paciente, id_estado, fecha_hora_inicio, fecha_hora_fin, precio_final, notas_consulta) VALUES
(1, 1, 1, '2026-09-20 09:00:00', '2026-09-20 09:40:00', 15000.00, 'Primera consulta de diagnóstico.'),
(2, 2, 4, '2026-09-15 10:30:00', '2026-09-15 11:15:00', 25000.00, 'Limpieza completada sin complicaciones.'),
(3, 3, 3, '2026-09-16 14:00:00', '2026-09-16 14:30:00', 0.00, 'Avisó que no puede asistir por trabajo.'),
(4, 4, 1, '2026-09-21 16:00:00', '2026-09-21 17:00:00', 32000.00, 'Control y posible restauración pieza 16.');

INSERT INTO turno_practica (id_turno, id_practica) VALUES
(1, 1),
(2, 2),
(4, 1),
(4, 3);