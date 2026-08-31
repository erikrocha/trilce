import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";

type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];

// Mapeo de colores de CLAUDE.md §4: pendiente=ámbar, parcial=azul,
// pagado=verde de marca, vencido=rojo, anulado=gris.
const STATUS_CLASSES: Record<InvoiceStatus, string> = {
  pendiente: "bg-badge-pendiente/15 text-badge-pendiente",
  parcial: "bg-badge-parcial/15 text-badge-parcial",
  pagado: "bg-badge-pagado/15 text-badge-pagado",
  vencido: "bg-badge-vencido/15 text-badge-vencido",
  anulado: "bg-muted text-badge-anulado",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge className={STATUS_CLASSES[status]}>
      {INVOICE_STATUS_LABELS[status]}
    </Badge>
  );
}
