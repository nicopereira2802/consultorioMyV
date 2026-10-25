//* FUNCION QUE CALCULA LA FECHA DE FIN DEL TURNO

export const calcularHoraFin = (datos, actualizarDatos) => {
  if (datos.fecha_hora_inicio && datos.duracion_minutos) {
    const inicio = new Date(datos.fecha_hora_inicio);
    const minutos = parseInt(datos.duracion_minutos, 10);
    if (!isNaN(inicio.getTime()) && !isNaN(minutos)) {
      const fin = new Date(inicio.getTime() + minutos * 60000);
      const isoFin = new Date(fin.getTime() - fin.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      actualizarDatos({ target: { name: "fecha_hora_fin", value: isoFin } });
    }
  }
};
