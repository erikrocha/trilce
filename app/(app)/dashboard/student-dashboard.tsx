import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEVEL_LABELS } from "@/app/(app)/alumnos/labels";

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export async function StudentDashboard({ studentId }: { studentId: string }) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle();

  const { data: invoices } = await supabase
    .from("student_invoices_display")
    .select("*")
    .eq("student_id", studentId)
    .order("due_date", { ascending: true });

  if (!student) {
    return <p className="text-sm text-muted-foreground">No se encontró tu registro.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">
          {student.paternal_surname} {student.maternal_surname ?? ""},{" "}
          {student.first_names}
        </h1>
        <p className="text-sm text-muted-foreground">
          {student.level ? LEVEL_LABELS[student.level] : "—"} · {student.grade ?? "—"}{" "}
          {student.section ?? ""} · {student.code}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis boletas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(invoices ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no tienes boletas generadas.
            </p>
          )}
          {(invoices ?? []).map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm"
            >
              <span>{invoice.description}</span>
              <div className="flex items-center gap-3">
                <span className="font-mono">
                  {currencyFormatter.format(invoice.amount ?? 0)}
                </span>
                <span className="text-muted-foreground">
                  {invoice.display_status}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
