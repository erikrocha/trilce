import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { PaymentOriginList } from "./payment-origin-list";

export default async function PagosPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: origins } = await supabase
    .from("payment_origins")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .order("name", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Orígenes de Pago</h1>
        <p className="text-sm text-muted-foreground">
          Formas de pago disponibles al registrar un cobro
        </p>
      </div>
      <PaymentOriginList origins={origins ?? []} canWrite={canWrite} />
    </div>
  );
}
