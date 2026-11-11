/** @format */
// Carga las prácticas del nomenclador "Aranceles Generales - Colegio Odontológico (Enero 2026)".
//
// Uso (desde la carpeta backend):
//   node scripts/seed_practicas.js              -> agrega las que faltan (no toca las existentes)
//   node scripts/seed_practicas.js --actualizar -> además actualiza nombre, especialidad y precio
//                                                  de las que ya existen con el mismo código
//
// - Usa la conexión del .env (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
// - Identifica cada práctica por su código del nomenclador: no duplica ni borra nada.
// - Códigos: son los del PDF con puntos (101 -> 01.01, 40101 -> 04.01.01, 100201 -> 10.02.01).
// - Precio de referencia = columna "Total Arancel" del PDF.
// - No carga las prácticas "A CONVENIR", sin valor ni las del capítulo 13 (discapacidad),
//   porque el PDF no tiene un precio para ellas.

import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const ACTUALIZAR = process.argv.includes("--actualizar");

// [codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia]
const PRACTICAS = [
  ["01.01", "Examen - Diagnóstico - Fichado y Plan de Tratamiento", "Arancel Colegio Odontológico (Ene-2026)", "Consultas", 43720],
  ["01.03", "Visita a Domicilio", "Arancel Colegio Odontológico (Ene-2026)", "Consultas", 61613],
  ["01.04", "Consulta de Urgencia que No Constituya Paso Intermedio de Tratamiento", "Arancel Colegio Odontológico (Ene-2026)", "Consultas", 70601],
  ["01.05", "Consulta Periódica Preventiva", "Arancel Colegio Odontológico (Ene-2026)", "Consultas", 43720],
  ["01.06", "Certificado Buco Dental", "Arancel Colegio Odontológico (Ene-2026)", "Consultas", 25828],
  ["02.09", "Reconstrucción de ángulos con material estético en dientes anteriores", "Arancel Colegio Odontológico (Ene-2026)", "Operatoria", 166165],
  ["02.15", "Restauración Simple de piezas dentarias", "Arancel Colegio Odontológico (Ene-2026)", "Operatoria", 75230],
  ["02.16", "Restauración Compuesta de piezas dentarias", "Arancel Colegio Odontológico (Ene-2026)", "Operatoria", 103338],
  ["02.17", "Restauración Compleja de piezas dentarias", "Arancel Colegio Odontológico (Ene-2026)", "Operatoria", 164574],
  ["02.18", "Blanqueamiento interno (por elemento)", "Arancel Colegio Odontológico (Ene-2026)", "Operatoria", 188056],
  ["02.19", "Blanqueamiento externo en consultorio (por sesión)", "Arancel Colegio Odontológico (Ene-2026)", "Operatoria", 257462],
  ["02.20", "Blanqueamiento ambulatorio", "Arancel Colegio Odontológico (Ene-2026)", "Operatoria", 323930],
  ["02.21", "Microabrasion (por elemento a tratar)", "Arancel Colegio Odontológico (Ene-2026)", "Operatoria", 33325],
  ["03.01", "Tratamiento Pulpar de 1 Conducto", "Arancel Colegio Odontológico (Ene-2026)", "Endodoncia", 162749],
  ["03.02", "Tratamiento Pulpar de 2 Conductos", "Arancel Colegio Odontológico (Ene-2026)", "Endodoncia", 220154],
  ["03.03", "Tratamiento Pulpar de 3 Conductos", "Arancel Colegio Odontológico (Ene-2026)", "Endodoncia", 281154],
  ["03.04", "Tratamiento Pulpar de 4 Conductos", "Arancel Colegio Odontológico (Ene-2026)", "Endodoncia", 324941],
  ["03.05", "Biopulpectomía Parcial", "Arancel Colegio Odontológico (Ene-2026)", "Endodoncia", 110914],
  ["03.06", "Necropulpectomía Parcial (momificación)", "Arancel Colegio Odontológico (Ene-2026)", "Endodoncia", 110914],
  ["03.07", "Protección Pulpar Indirecta", "Arancel Colegio Odontológico (Ene-2026)", "Endodoncia", 88788],
  ["04.01.01", "Incrustación Cavidad Simple", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 274844],
  ["04.01.02", "Incrustación Cavidad Compuesta", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 360579],
  ["04.01.03", "Corona Forjada", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 166768],
  ["04.01.04", "Corona Colada", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 381588],
  ["04.01.05", "Corona Colada c/ Frente Estético de Acrílico", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 424512],
  ["04.01.06", "Corona Espiga", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 432512],
  ["04.01.07", "Recementado de Perno o Corona", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 72418],
  ["04.01.08", "Perno Muñon Simple", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 288142],
  ["04.01.09", "Perno Muñon Seccionado", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 402853],
  ["04.01.10", "Tramo de Puente Colado", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 298644],
  ["04.01.11", "Corona en Acrílico", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 319560],
  ["04.01.12", "Elemento Provisorio de Acrílico", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 116278],
  ["04.01.13", "Corona de Porcelana sobre metal", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 529538],
  ["04.01.14", "Tramo de puente porcelana s/metal por elemento a reemplazar c/u", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 456858],
  ["04.01.15", "Corona de porcelana pura", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 534862],
  ["04.01.16", "Tramo de puente de porcelana por elemento a reemplazar c/u", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 461858],
  ["04.01.17", "Corona de zirconio", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 541105],
  ["04.01.18", "Tramo de puente de porcelana sobre zirconio", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 466858],
  ["04.01.19", "Extracción de un Perno", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 172866],
  ["04.01.20", "Extracción de una Corona", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 136664],
  ["04.01.21", "Incrustación de resina", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 485738],
  ["04.01.22", "Incrustación cerámica", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 512415],
  ["04.01.23", "Carillas de porcelana", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 403541],
  ["04.01.24", "Carillas de resina", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 337379],
  ["04.01.25", "Perno de fibra de vidrio", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 244040],
  ["04.02.01", "Prótesis parcial de acrílico hasta 5 elementos", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 425871],
  ["04.02.02", "Prótesis Parcial de Acrílico mas de 5 elementos", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 516246],
  ["04.02.03", "Prótesis parcial de Cromo Cobalto hasta 5 elementos", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 651078],
  ["04.02.04", "Protesis Parcial Colada en Cromo Cobalto mas de 5 elementos", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 751494],
  ["04.02.05", "Prótesis parcial inmediata", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 466496],
  ["04.02.06", "Prótesis parcial de Nylon", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 502210],
  ["04.03.01", "Prótesis Completa Acrílico Superior o Inferior", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 799468],
  ["04.03.03", "Protesis Completa Inmediata", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 814468],
  ["04.03.04", "Base Colada para Prótesis Completa", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 288913],
  ["04.04.01", "Compostura Simple", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 102743],
  ["04.04.02", "Compostura c/ Agregado de 1 Diente", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 108493],
  ["04.04.03", "Compostura c/ Agregado de 1 Retenedor", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 108493],
  ["04.04.04", "Compostura c/ Agregado de 1 Diente y 1 Retenedor", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 159044],
  ["04.04.05", "Dientes Subsiguientes: cada uno", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 22527],
  ["04.04.06", "Retenedor Subsiguiente: cada uno", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 22527],
  ["04.04.07", "Soldadura de Armazon de Cromo Cobalto c/ Agregado", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 149599],
  ["04.04.08", "Soldadura de Retenedor Subsiguiente", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 56054],
  ["04.04.09", "Carilla de Acrílico", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 81918],
  ["04.04.10", "Rebasado de Prótesis", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 161018],
  ["04.04.11", "Cubeta Individual", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 88656],
  ["04.04.12", "Levante de Artic. en Acrílico y Retenedores Forjado", "Arancel Colegio Odontológico (Ene-2026)", "Prótesis", 269300],
  ["05.00", "Consulta Preventiva y de Relevamiento", "Arancel Colegio Odontológico (Ene-2026)", "Prevención", 43720],
  ["05.01", "Tartrectomía, cepillado mecánico y fisioterapia -motivación-", "Arancel Colegio Odontológico (Ene-2026)", "Prevención", 63526],
  ["05.02", "Topicación con Fluor por Tratamiento", "Arancel Colegio Odontológico (Ene-2026)", "Prevención", 62279],
  ["05.02.01", "Topicación con Fluor en Embarazada", "Arancel Colegio Odontológico (Ene-2026)", "Prevención", 53333],
  ["05.03", "Inactivación de Policaries Activas", "Arancel Colegio Odontológico (Ene-2026)", "Prevención", 86937],
  ["05.04", "Detección - Control de Placa Bact. y Enseñanza de Higiene Bucal", "Arancel Colegio Odontológico (Ene-2026)", "Prevención", 59008],
  ["05.05", "Sellantes de Fosas y Fisuras, por Pieza", "Arancel Colegio Odontológico (Ene-2026)", "Prevención", 53669],
  ["05.06", "Protectores Bucales", "Arancel Colegio Odontológico (Ene-2026)", "Prevención", 121280],
  ["06.01", "Consulta de Estudio", "Arancel Colegio Odontológico (Ene-2026)", "Ortodoncia", 155718],
  ["06.02", "Tratam. de la Dentición Primaria/Mixta (Ortopedia).(12 meses de tratam.)", "Arancel Colegio Odontológico (Ene-2026)", "Ortodoncia", 1399187],
  ["06.03", "Tratam. Ortodoncia. (Primer año de tratamiento)", "Arancel Colegio Odontológico (Ene-2026)", "Ortodoncia", 2429914],
  ["06.03.01", "Tratam. Ortodoncia. ( Segundo año de tratamiento)", "Arancel Colegio Odontológico (Ene-2026)", "Ortodoncia", 2070560],
  ["06.04", "Corrección de Malposiciones Simples con Espacio", "Arancel Colegio Odontológico (Ene-2026)", "Ortodoncia", 1135664],
  ["06.08", "Contención fija y/o removible ambos maxilares (Incluye 6 controles)", "Arancel Colegio Odontológico (Ene-2026)", "Ortodoncia", 425255],
  ["07.01", "Motivación en Menores de 13 años", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 85893],
  ["07.02", "Motivación en Pacientes con discapacidad", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 220088],
  ["07.03", "Coronas Metálicas de Acero para Dientes Primarios", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 147802],
  ["07.04", "Mantenedor de Espacio Fijo", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 197124],
  ["07.05", "Mantenedor de Espacio Removible", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 127751],
  ["07.06", "Reducción de Luxación con Inmovilización Dentaria", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 251429],
  ["07.07", "Reducción Total (reimplante) e Inmovilización Dentaria", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 305107],
  ["07.08", "Fractura Coronaria de Esmalte", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 98552],
  ["07.09", "Fractura Amelodentinaria. Protección Pulpar Coronas Provisorias", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 181393],
  ["07.10", "Tratamiento de Dientes Primarios con Formocresol", "Arancel Colegio Odontológico (Ene-2026)", "Odontopediatría", 96689],
  ["08.01", "Consulta periodontal - Diagnóstico - Pronóstico", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 61613],
  ["08.02", "Tratamiento de gingivitis marginal crónica (ambas arcadas)", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 121298],
  ["08.03", "Trat. de Periodontitis Destructiva Leve o Moderada Hasta 5mm por Sector", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 88452],
  ["08.04", "Trat. de periodontitis destructiva leve o moderada de 6mm o más por sector", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 115291],
  ["08.05", "Desgaste Selectivo o Armonización Oclusal", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 182350],
  ["08.06", "Placas Oclusales (temporarias) de Acrílico Removibles", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 334314],
  ["08.07", "Gingivectomía por sector", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 101633],
  ["08.12", "Tratamiento de Gingivitis por Arcada", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 60649],
  ["08.13", "Enseñanza de Técnicas de Higiene Oral en Adultos", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 59008],
  ["08.14", "Controles Post Tratamiento sin Instrumentación", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 26964],
  ["08.15", "Controles Post Tratamiento con Instrumentación", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 27008],
  ["08.16", "Raspaje y Curetaje por Elemento", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 18186],
  ["08.17", "Tratamiento Quirúrgico por Elemento", "Arancel Colegio Odontológico (Ene-2026)", "Periodoncia", 63551],
  ["09.01.01", "Radiografía Periapical", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 21479],
  ["09.01.02", "Bite-Wing", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 21479],
  ["09.01.03", "Radiografía Oclusal", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 26763],
  ["09.01.04", "Radiografía Media Seriada hasta 7 Placas", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 82510],
  ["09.01.05", "Radiografía Seriada Ambos Maxilares hasta 14 Placas", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 122149],
  ["09.02.01", "Radiografía Extrabucal Primera Exposición", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 30089],
  ["09.02.02", "Radiografía Extrabucal Subsiguientes", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 9630],
  ["09.02.03", "Articulación Temporo-Mandibular", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 112175],
  ["09.02.04", "Pantomografía", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 56928],
  ["09.02.05", "Teleradiografía", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 56928],
  ["09.02.06", "Sialografía", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 56928],
  ["09.02.07", "Estudio Cefalométrico. (No Incluido en estructura de costos C.O.R.A.)", "Arancel Colegio Odontológico (Ene-2026)", "Radiología", 56928],
  ["10.01", "Extracción dentaria simple", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 84605],
  ["10.02", "Plástica de Comunicación Bucosinusal Inmediata a la Exodoncia", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 109973],
  ["10.03", "Biopsia por Punción o Aspiración", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 88183],
  ["10.04", "Alveolectomía Estabilizadora por 6 Zonas", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 99446],
  ["10.05", "Reimplante Dentario Inmediato al Traumatismo", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 120143],
  ["10.06", "Biopsia por Escisión", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 97781],
  ["10.07", "Incisiones y drenajes de abscesos por vía bucal", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 75280],
  ["10.08", "Alargamiento Quirúrgico de la Corona Clínica", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 86703],
  ["10.09", "Extracción de Dientes Retenidos", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 289699],
  ["10.09.01", "Extracción de dientes con retención mucosa", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 143896],
  ["10.10", "Germectomía", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 286216],
  ["10.11", "Liberación de Dientes Retenidos", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 126146],
  ["10.12", "Apicectomía", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 157783],
  ["10.13", "Tratamiento de Osteomielitis", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 158292],
  ["10.14", "Extracción de Cuerpo Extraño", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 242507],
  ["10.15", "Alveolectomia Correctiva por 6 Zonas", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 95132],
  ["10.16", "Tratamiento de alveolitis", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 126712],
  ["10.17", "Tratamiento quirúrgico de hemorragia post extracción", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 116185],
  ["10.18", "Extracción c/ Alveolectomia Ext. y Restos Radiculares", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 126712],
  ["10.20", "Frenectomía Técnica Simple", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 274087],
  ["10.21", "Gingivectomía con fines protéticos por elemento", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo uno", "Cirugía", 63551],
  ["10.02.01", "Alveolectomía Correctiva / Estabilizadora Compleja S ó I", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.02", "Apicectomía con Dificultades (premolares hacia atrás)", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.03", "Extirpación de Tumores, Quistes o Hiperplasias Pequeñas (hasta 2 cm)", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.04", "Extracción de Dientes o Restos Radiculares Retenidos Complejos", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.05", "Radectomía", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.06", "Toma de Material para Biopsias con Dificultad", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.07", "Tratamiento de Fractura Dento-Alveolar Compleja", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.08", "Tratamiento de Herida de Tejidos Blandos Compleja", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.09", "Vestibuloplastía de Max Superior / Inferior", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.10", "Injerto Oseo en Maxilares (con hueso autólogo)", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.02.11", "Frenectomía Técnica Compleja", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo dos", "Cirugía", 459467],
  ["10.03.01", "Antrotomía de Senos Maxilares", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo tres", "Cirugía", 1420996],
  ["10.03.02", "Extirpación de Tumores, Quistes o Hiperplasias Medianas. (de 2 a 4 cm)", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo tres", "Cirugía", 1420996],
  ["10.03.03", "Plástica de Fístula Sinusal o Buconasal", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo tres", "Cirugía", 1420996],
  ["10.03.04", "Tratamiento Quirúrgico de Osteomielitis", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo tres", "Cirugía", 1420996],
  ["10.04.01", "Cirugía de la A.T.M", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo cuatro", "Cirugía", 2817358],
  ["10.04.02", "Corrección de Malformaciones Dentofaciales y Secuelas de Traumatismos", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo cuatro", "Cirugía", 2817358],
  ["10.04.03", "Extirpación de Tumores, Quistes o Hiperplasias Grandes. (más de 4 cm)", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo cuatro", "Cirugía", 2817358],
  ["10.04.04", "Submaxilectomias o Sublingualectomias", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo cuatro", "Cirugía", 2817358],
  ["10.04.05", "Plástica de Labio o Paladar Fisurado; por Cada Uno", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo cuatro", "Cirugía", 2817358],
  ["10.04.06", "Reconstrucción con Colgajos de Vecindad o Injertos Oseos", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo cuatro", "Cirugía", 2817358],
  ["10.04.07", "Tratamiento de Fracturas de los Huesos de la Cara", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo cuatro", "Cirugía", 2817358],
  ["10.04.08", "Cirugía para Distracción Osteogénica", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo cuatro", "Cirugía", 2817358],
  ["10.04.09", "Injerto Oseo Complejo (con hueso autólogo)", "Arancel Colegio Odontológico (Ene-2026) · Cirugía grupo cuatro", "Cirugía", 2817358],
  ["11.02", "Técnica Quirúrgica Simple: colocación de 1 implante Maxilar Sup. ó Inferior", "Arancel Colegio Odontológico (Ene-2026)", "Implantología", 1000718],
  ["12.01", "Exámenes complementarios para diagnóstico y plan de tratamiento", "Arancel Colegio Odontológico (Ene-2026)", "Prestaciones Varias", 35785],
  ["12.08", "Tratamiento Sindrome temporo mandibulares", "Arancel Colegio Odontológico (Ene-2026)", "Prestaciones Varias", 1045651],
  ["14.01.00", "Primera consulta en estomatología", "Arancel Colegio Odontológico (Ene-2026)", "Estomatología", 118259],
  ["14.02.00", "Consulta Ulterior", "Arancel Colegio Odontológico (Ene-2026)", "Estomatología", 75885],
  ["14.03.00", "Consulta de Urgencia Estomatológica", "Arancel Colegio Odontológico (Ene-2026)", "Estomatología", 93777],
  ["14.08.00", "Biopsia incisional de tejido blando", "Arancel Colegio Odontológico (Ene-2026)", "Estomatología", 97781]
];

async function seedPracticas() {
  const { DB_HOST, DB_PORT, DB_NAME, DB_USER } = process.env;
  const password = process.env.DB_PASS || process.env.DB_PASSWORD || "";

  if (!DB_NAME) {
    console.error("Falta DB_NAME en el archivo .env.");
    process.exit(1);
  }

  let conn;
  try {
    conn = await mysql.createConnection({
      host: DB_HOST || "localhost",
      port: Number(DB_PORT) || 3306,
      user: DB_USER || "root",
      password,
      database: DB_NAME,
    });
    console.log(`Conectado a la base '${DB_NAME}'. Prácticas a procesar: ${PRACTICAS.length}`);

    let agregadas = 0;
    let actualizadas = 0;
    let salteadas = 0;

    for (const [codigo, nombre, referencia, especialidad, precio] of PRACTICAS) {
      const [existentes] = await conn.execute(
        "SELECT id_practica FROM practica WHERE codigo_nomenclador = ? LIMIT 1",
        [codigo],
      );

      if (existentes.length > 0) {
        if (ACTUALIZAR) {
          await conn.execute(
            `UPDATE practica
                SET nombre_nomenclador = ?, nombre_referencia = ?, especialidad = ?, precio_referencia = ?
              WHERE id_practica = ?`,
            [nombre, referencia, especialidad, precio, existentes[0].id_practica],
          );
          actualizadas++;
        } else {
          console.log(`  - Ya existe, se saltea: ${codigo} ${nombre}`);
          salteadas++;
        }
        continue;
      }

      await conn.execute(
        `INSERT INTO practica
           (codigo_nomenclador, nombre_nomenclador, nombre_referencia, especialidad, precio_referencia, activo)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [codigo, nombre, referencia, especialidad, precio],
      );
      agregadas++;
    }

    console.log(
      `\nListo. Agregadas: ${agregadas}. Actualizadas: ${actualizadas}. Salteadas por existir: ${salteadas}.`,
    );
  } catch (error) {
    console.error("Error al cargar las prácticas:", error.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

seedPracticas();