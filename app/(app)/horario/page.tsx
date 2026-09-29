import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import type { ClassGroupOption } from "../configuracion/asignacion-cursos/course-offering-list";
import { ClassGroupSelector } from "./class-group-selector";
import { ScheduleTable } from "./schedule-table";
import type {
  ActivityOption,
  OfferingOption,
  SchedulePeriod,
  ScheduleSlotRow,
} from "./types";

export default async function HorarioPage(props: PageProps<"/horario">) {
  const ctx = await requireAppContext();
  const searchParams = await props.searchParams;
  const classGroupIdParam = Array.isArray(searchParams.classGroupId)
    ? searchParams.classGroupId[0]
    : searchParams.classGroupId;

  const canEdit = ctx.role === "admin" || ctx.role === "administrativo";
  const supabase = await createClient();

  const { data: periods } = await supabase
    .from("schedule_periods")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .order("start_time", { ascending: true });

  // La MISMA consulta corre para admin, docente, padre y alumno — RLS
  // (63_horario_base_rls.sql) ya devuelve solo lo que a cada quien le
  // corresponde. El filtro por sección es opcional y puramente de UI (solo
  // lo expone el selector, visible nada más para admin/administrativo).
  let slotsQuery = supabase
    .from("schedule_slots")
    .select(
      `id, period_id, day_of_week, course_offering_id, activity_id, classroom,
       course_offerings (
         id, class_group_id, teacher_id,
         courses ( name, short_code ),
         class_groups ( academic_year, level, grade, section ),
         staff_members ( full_name )
       ),
       schedule_activities ( name )`
    );

  if (classGroupIdParam) {
    const { data: offeringsInGroup } = await supabase
      .from("course_offerings")
      .select("id")
      .eq("class_group_id", classGroupIdParam);
    const offeringIds = (offeringsInGroup ?? []).map((o) => o.id);
    // Al filtrar por sección seguimos mostrando las actividades globales
    // (no pertenecen a ninguna sección) más los cursos de esa sección.
    slotsQuery = slotsQuery.or(
      `activity_id.not.is.null,course_offering_id.in.(${
        offeringIds.length > 0 ? offeringIds.join(",") : "00000000-0000-0000-0000-000000000000"
      })`
    );
  }

  const { data: slots } = await slotsQuery;

  let offerings: OfferingOption[] = [];
  let activities: ActivityOption[] = [];
  let classGroups: ClassGroupOption[] = [];
  if (canEdit) {
    const [{ data: offeringsData }, { data: activitiesData }, { data: classGroupsData }] =
      await Promise.all([
        supabase
          .from("course_offerings")
          .select(
            "id, class_group_id, courses(name, short_code), class_groups(academic_year, level, grade, section), staff_members(full_name)"
          )
          .eq("school_id", ctx.schoolId!),
        supabase
          .from("schedule_activities")
          .select("id, name")
          .eq("school_id", ctx.schoolId!)
          .eq("active", true)
          .order("name"),
        supabase
          .from("class_groups")
          .select("id, academic_year, level, grade, section")
          .eq("school_id", ctx.schoolId!)
          .order("academic_year", { ascending: false })
          .order("grade", { ascending: true })
          .order("section", { ascending: true }),
      ]);
    offerings = offeringsData ?? [];
    activities = activitiesData ?? [];
    classGroups = classGroupsData ?? [];
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Horario</h1>
          <p className="text-sm text-muted-foreground">
            {canEdit ? "Horario semanal del colegio" : "Tu horario semanal"}
          </p>
        </div>
        {canEdit && (
          <ClassGroupSelector
            classGroups={classGroups}
            selectedId={classGroupIdParam}
          />
        )}
      </div>

      <ScheduleTable
        periods={(periods ?? []) as SchedulePeriod[]}
        slots={(slots ?? []) as ScheduleSlotRow[]}
        canEdit={canEdit}
        offerings={offerings}
        activities={activities}
      />
    </div>
  );
}
