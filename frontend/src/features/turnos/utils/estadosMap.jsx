//* COMPONENTE USADO PARA BADGE DE ESTADO EN TABLA TURNOS

import { CheckCircle2, Clock, XCircle, UserRoundX } from "lucide-react";

export const estadosMap = {
  Programado: { id_estado: 1, color: "bg-amber-50 text-amber-700 border-amber-200/60", icon: Clock },
  Atendido: {
    id_estado: 2,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    icon: CheckCircle2,
  },
  Cancelado: { id_estado: 3, color: "bg-red-50 text-red-700 border-red-200/60", icon: XCircle },
  Inasistente: { id_estado: 4, color: "bg-[#f0f6f9] text-[#2b5d73] border-[#93BBCF]", icon: UserRoundX },
};
