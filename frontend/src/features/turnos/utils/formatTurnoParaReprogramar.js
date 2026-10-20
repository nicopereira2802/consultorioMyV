import { formatDateTimeInput } from "../../../utils";
export const formatearTurnoParaReprogramar = (item) => ({
  fecha_hora_inicio: formatDateTimeInput(item.fecha_hora_inicio),
  duracion_minutos: item.duracion_minutos || 30,
  fecha_hora_fin: formatDateTimeInput(item.fecha_hora_fin),
});
