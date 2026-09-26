-- ==========================================================
-- SCRIPT DE INICIALIZACIÓN: consultorio_myv
-- ==========================================================

USE consultorio_myv;

-- ==========================================================
-- CARGA DE DATOS DE PRUEBA (SEEDERS)
-- ==========================================================

INSERT INTO estado_turno (id_estado, estado) VALUES
(1, 'Programado'),
(2, 'Cancelado'),
(3, 'Atendido'),
(4, 'Inasistente');

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

INSERT INTO practica_turno (id_turno, id_practica) VALUES
(1, 1),
(2, 2),
(1, 4),
(3, 4);