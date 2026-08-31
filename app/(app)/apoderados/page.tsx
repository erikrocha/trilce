import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { GuardianList } from "./guardian-list";

export default async function ApoderadosPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: guardians } = await supabase
    .from("guardians")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .order("paternal_surname", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Apoderados</h1>
        <p className="text-sm text-muted-foreground">
          {guardians?.length ?? 0} apoderado(s) registrados
        </p>
      </div>
      <GuardianList guardians={guardians ?? []} canWrite={canWrite} />
    </div>
  );
}
