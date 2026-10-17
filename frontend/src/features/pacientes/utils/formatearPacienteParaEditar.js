export const formatearPacienteParaEditar = (item) => ({
  nombre: item.nombre,
  apellido: item.apellido,
  dni: item.dni,
  fecha_nacimiento: item.fecha_nacimiento,
  telefono: item.telefono,
  domicilio: item.domicilio,
  obrasSociales:
    item.PacienteObraSocials?.map((relacion) => ({
      id_obra_social: relacion.id_obra_social,
      nro_afiliado: relacion.nro_afiliado || "",
      guardadoEnBD: true,
      id_relacion: relacion.id_paciente_obra_social,
    })) || [],
  obrasSocialesEliminadas: [],
});
