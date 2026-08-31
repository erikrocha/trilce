import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { DocumentTypeList } from "./document-type-list";

export default async function TalonarioPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: documentTypes } = await supabase
    .from("document_types")
    .select("*, document_series(*)")
    .eq("school_id", ctx.schoolId!)
    .order("name", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Talonario</h1>
        <p className="text-sm text-muted-foreground">
          Tipos de documento y sus series de numeración
        </p>
      </div>
      <DocumentTypeList
        documentTypes={documentTypes ?? []}
        canWrite={canWrite}
      />
    </div>
  );
}
