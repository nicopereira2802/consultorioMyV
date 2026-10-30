export const ESTADO_INICIAL_TURNO = {
  id_paciente: "",
  id_estado: 1,
  fecha_hora_inicio: "",
  fecha_hora_fin: "",
  duracion_minutos: 30,
  precio_final: 0,
  notas_consulta: "",
};

export const HORARIO_ATENCION_DEFAULT = {
  horaInicio: 9,
  horaFin: 20,
  inicioStr: "09:00",
  finStr: "20:00",
  slotMinTime: "09:00:00",
  slotMaxTime: "20:00:00",
};

export const MODALIDADES_OCUPACION = [
  {
    id: "predeterminado",
    label: "Predeterminado",
    verdeMax: 60,
    amarilloMax: 85,
  },
  {
    id: "medio_dia",
    label: "Medio día ocupado",
    verdeMax: 25,
    amarilloMax: 45,
  },
  {
    id: "un_cuarto",
    label: "1/4 de día ocupado",
    verdeMax: 45,
    amarilloMax: 70,
  },
  {
    id: "tres_cuartos",
    label: "3/4 de día ocupado",
    verdeMax: 10,
    amarilloMax: 25,
  },
];

export const COLORES_OCUPACION = {
  blanco: {
    bg: "#ffffff",
    border: "#e2e8f0",
    text: "#1e293b",
    dot: "#ffffff",
    nombre: "Sin turnos",
  },
  verde: {
    bg: "#bbf7d0",
    border: "#86efac",
    text: "#14532d",
    dot: "#4ade80",
    nombre: "Disponible",
  },
  amarillo: {
    bg: "#fde68a",
    border: "#fcd34d",
    text: "#78350f",
    dot: "#facc15",
    nombre: "Media",
  },
  rojo: {
    bg: "#fecaca",
    border: "#fca5a5",
    text: "#7f1d1d",
    dot: "#f87171",
    nombre: "Alta",
  },
};
