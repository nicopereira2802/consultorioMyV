/** @format */

import { formatFechaInput } from "../../../utils";

export const formatearGastoParaEditar = (item) => ({
  id_categoria_gasto: item.id_categoria_gasto || "",
  monto: item.monto || "",
  concepto: item.concepto || "",
  fecha_gasto: item.fecha_gasto ? formatFechaInput(item.fecha_gasto) : "",
  metodo_pago: item.metodo_pago || "Efectivo",
  comprobante: item.comprobante || "",
  notas: item.notas || "",
});
