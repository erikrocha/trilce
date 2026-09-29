import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { studentQrDataUrl } from "@/lib/qrcode";
import { GroupPicker } from "./group-picker";
import { PrintButton } from "./print-button";
import { StudentCard } from "./student-card";

export default async function TarjetasPage(
  props: PageProps<"/cuestionarios/tarjetas">
) {
  const ctx = await requireAppContext();
  const searchParams = await props.searchParams;
  const classGroupId = Array.isArray(searchParams.classGroupId)
    ? searchParams.classGroupId[0]
    : searchParams.classGroupId;

  const supabase = await createClient();

  const { data: classGroups } = await supabase
    .from("class_groups")
    .select("id, academic_year, level, grade, section")
    .eq("school_id", ctx.schoolId!)
    .order("academic_year", { ascending: false })
    .order("grade", { ascending: true })
    .order("section", { ascending: true });

  const { data: students } = classGroupId
    ? await supabase
        .from("students")
        .select("id, code, first_names, paternal_surname, maternal_surname")
        .eq("class_group_id", classGroupId)
        .neq("status", "inactivo")
        .order("paternal_surname", { ascending: true })
    : { data: [] };

  const cards = await Promise.all(
    (students ?? []).map(async (student) => ({
      student,
      qr: await studentQrDataUrl(student.code),
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-lg font-medium">Tarjetas QR</h1>
          <p className="text-sm text-muted-foreground">
            Una tarjeta fija por alumno — se imprime una vez y sirve para
            todos los cuestionarios futuros.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GroupPicker classGroups={classGroups ?? []} selectedId={classGroupId} />
          <PrintButton disabled={cards.length === 0} />
        </div>
      </div>

      {classGroupId && cards.length === 0 && (
        <p className="text-sm text-muted-foreground print:hidden">
          Esta sección no tiene alumnos vinculados todavía.
        </p>
      )}

      <div className="flex flex-col">
        {cards.map(({ student, qr }) => (
          <StudentCard key={student.id} student={student} qrDataUrl={qr} />
        ))}
      </div>
    </div>
  );
}
