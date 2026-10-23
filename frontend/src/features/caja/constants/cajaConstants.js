export const ESTADO_INICIAL_GASTO = {
  id_categoria_gasto: "",
  monto: "",
  concepto: "",
  fecha_gasto: new Date().toISOString().split("T")[0],
  metodo_pago: "Efectivo",
  comprobante: "",
  notas: "",
};

export const ESTADO_INICIAL_COBRO = {
  id_paciente: "",
  id_turno: "",
  monto_a_cobrar: "",
  modalidad: "Contado",
  cant_cuotas: 1,
  metodo_pago: "Efectivo",
  notas: "",
};
