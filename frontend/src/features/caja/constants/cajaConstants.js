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
  monto_abonado: "",
  modalidad: "",
  cant_cuotas: 1,
  fecha_primer_vencimiento: new Date().toISOString().split("T")[0],
  cobrar_primera_cuota: true,
  metodo_pago: "Efectivo",
  entrega_inicial: "",
  notas: "",
};
