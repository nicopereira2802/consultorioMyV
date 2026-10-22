//* FUNCION QUE CALCULA PRECIO FINAL BASE (RESPECTO A PRACTICAS)

export const calcularPrecioPracticas = (datosAtencion, practicasLista, setDatosAtencion) => {
  let totalPrecio = 0;
  datosAtencion.practicas.forEach((item) => {
    if (item.id_practica) {
      const encontrada = practicasLista.find((p) => Number(p.id_practica) === Number(item.id_practica));
      if (encontrada) totalPrecio += Number(encontrada.precio_referencia || 0);
    }
  });
  setDatosAtencion((prev) => ({ ...prev, precio_final: totalPrecio }));
};
