import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { RegisterPaymentFlow } from "./register-payment-flow";

export default async function RegistrarPagoPage() {
  const ctx = await requireAppContext();
  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  if (!canWrite) {
    return (
      <p className="text-sm text-muted-foreground">
        No tienes permiso para registrar pagos.
      </p>
    );
  }

  const supabase = await createClient();

  const { data: documentTypes } = await supabase
    .from("document_types")
    .select("id, name, requires_igv, document_series(id, series_code, active)")
    .eq("school_id", ctx.schoolId!)
    .eq("active", true)
    .order("name");

  const { data: origins } = await supabase
    .from("payment_origins")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .eq("active", true)
    .order("name");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Registrar Pago</h1>
        <p className="text-sm text-muted-foreground">
          Emite un comprobante y aplícalo a una o más boletas del alumno.
        </p>
      </div>
      <RegisterPaymentFlow
        documentTypes={documentTypes ?? []}
        origins={origins ?? []}
      />
    </div>
  );
}
