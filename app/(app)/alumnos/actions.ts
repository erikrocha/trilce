"use server";

import { revalidatePath } from "next/cache";
import { requireAppContext } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/server";
import { MONTH_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";

type SexType = Database["public"]["Enums"]["sex_type"];
type DocumentIdType = Database["public"]["Enums"]["document_id_type"];
type EnrollmentLevel = Database["public"]["Enums"]["enrollment_level"];
type StudentStatus = Database["public"]["Enums"]["student_status"];
type RelationshipType = Database["public"]["Enums"]["relationship_type"];

type Student = Database["public"]["Tables"]["students"]["Row"];

export type StudentCredentials = {
  username: string;
  email: string;
  temp_password: string;
};

export type FormState =
  | { error: string }
  | {
      student: Student;
      credentials?: StudentCredentials;
      loginError?: string;
    }
  | undefined;

const CAN_WRITE_ROLES = ["admin", "administrativo"];

function str(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

// Sección (class_groups) del año en curso que coincide con nivel/grado/sección
// del alumno — la usan cuestionarios, juegos y horario.
async function findClassGroupId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  schoolId: string,
  fields: { level: EnrollmentLevel | null; grade: string | null; section: string | null }
) {
  if (!fields.level || !fields.grade || !fields.section) return null;
  const { data } = await supabase
    .from("class_groups")
    .select("id")
    .eq("school_id", schoolId)
    .eq("academic_year", new Date().getFullYear())
    .eq("level", fields.level)
    .eq("grade", fields.grade)
    .eq("section", fields.section)
    .maybeSingle();
  return data?.id ?? null;
}

function studentFields(formData: FormData) {
  return {
    code: str(formData, "code"),
    paternal_surname: str(formData, "paternal_surname"),
    maternal_surname: str(formData, "maternal_surname"),
    first_names: str(formData, "first_names"),
    sex: str(formData, "sex") as SexType | null,
    birth_date: str(formData, "birth_date"),
    document_type: (str(formData, "document_type") ?? "DNI") as DocumentIdType,
    document_number: str(formData, "document_number"),
    level: str(formData, "level") as EnrollmentLevel | null,
    grade: str(formData, "grade"),
    section: str(formData, "section"),
    entry_year: formData.get("entry_year")
      ? Number(formData.get("entry_year"))
      : null,
    status: str(formData, "status") as StudentStatus | null,
  };
}

export async function createStudent(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear alumnos." };
  }

  const fields = studentFields(formData);
  if (!fields.code || !fields.paternal_surname || !fields.first_names) {
    return { error: "Código, apellido paterno y nombres son obligatorios." };
  }

  const supabase = await createClient();
  const classGroupId = await findClassGroupId(supabase, ctx.schoolId, fields);
  const { data: student, error } = await supabase
    .from("students")
    .insert({
      school_id: ctx.schoolId,
      code: fields.code,
      paternal_surname: fields.paternal_surname,
      maternal_surname: fields.maternal_surname,
      first_names: fields.first_names,
      sex: fields.sex,
      birth_date: fields.birth_date,
      document_type: fields.document_type,
      document_number: fields.document_number,
      level: fields.level,
      grade: fields.grade,
      section: fields.section,
      entry_year: fields.entry_year,
      class_group_id: classGroupId,
    })
    .select()
    .single();

  if (error || !student) {
    return {
      error:
        error?.code === "23505"
          ? "Ya existe un alumno con ese código en este colegio."
          : "No se pudo guardar el alumno.",
    };
  }

  // Cada alumno nuevo recibe su acceso: correo sintético + usuario +
  // contraseña temporal (ver 38_student_auto_login.sql). Si falla, el alumno
  // igual queda creado y se informa el motivo.
  const { data: login, error: loginError } = await supabase.rpc(
    "provision_student_login",
    { p_student_id: student.id }
  );

  revalidatePath("/alumnos");
  revalidatePath("/miembros");
  // Devolvemos el alumno creado para que el panel pase a modo edición sin
  // cerrarse — recién ahí existe un student_id con el que vincular apoderados.
  return {
    student: { ...student, institutional_email: login?.[0]?.email ?? null },
    credentials: login?.[0],
    loginError: loginError
      ? `El alumno se creó, pero no se pudo generar su acceso: ${loginError.message}`
      : undefined,
  };
}

export async function updateStudent(
  studentId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para editar alumnos." };
  }

  const fields = studentFields(formData);
  if (!fields.code || !fields.paternal_surname || !fields.first_names) {
    return { error: "Código, apellido paterno y nombres son obligatorios." };
  }

  const supabase = await createClient();
  const classGroupId = await findClassGroupId(supabase, ctx.schoolId, fields);
  const wasRetired = fields.status === "retirado";
  const isInactive = fields.status === "inactivo";
  const { error } = await supabase
    .from("students")
    .update({
      code: fields.code,
      paternal_surname: fields.paternal_surname,
      maternal_surname: fields.maternal_surname,
      first_names: fields.first_names,
      sex: fields.sex,
      birth_date: fields.birth_date,
      document_type: fields.document_type,
      document_number: fields.document_number,
      level: fields.level,
      grade: fields.grade,
      section: fields.section,
      entry_year: fields.entry_year,
      status: fields.status ?? "activo",
      enrolled: !wasRetired && !isInactive,
      exit_date: wasRetired ? new Date().toISOString().slice(0, 10) : null,
      class_group_id: classGroupId,
    })
    .eq("id", studentId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ya existe un alumno con ese código en este colegio."
          : "No se pudo guardar el alumno.",
    };
  }

  revalidatePath("/alumnos");
  return undefined;
}

export type StudentBillingSummary = { invoices: number; payments: number };

async function billingSummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string
): Promise<StudentBillingSummary> {
  const [{ count: invoices }, { count: payments }] = await Promise.all([
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
    supabase
      .from("payment_documents")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
  ]);
  return { invoices: invoices ?? 0, payments: payments ?? 0 };
}

export async function getStudentBillingSummary(
  studentId: string
): Promise<{ error: string } | StudentBillingSummary> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para eliminar alumnos." };
  }
  const supabase = await createClient();
  return billingSummary(supabase, studentId);
}

// Borrado físico de un alumno. Pensado para limpiar registros de prueba o
// cargados por error — para un alumno real que deja el colegio, lo correcto es
// marcarlo "Retirado" y conservar su historial.
//
// Si el alumno ya tiene cobros o pagos, las FKs `on delete restrict` impiden
// borrarlo. En ese caso solo el admin puede forzar el borrado, y debe
// confirmar escribiendo el código del alumno: se eliminan primero sus
// comprobantes de pago (los ítems caen en cascada), luego sus cobros y al
// final el alumno (apoderados vinculados, login, etc. caen en cascada).
export async function deleteStudent(
  studentId: string,
  confirmCode?: string
): Promise<{ error: string } | undefined> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para eliminar alumnos." };
  }

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, code")
    .eq("id", studentId)
    .eq("school_id", ctx.schoolId)
    .maybeSingle();

  if (!student) {
    return { error: "Alumno no encontrado." };
  }

  const summary = await billingSummary(supabase, studentId);
  const hasBilling = summary.invoices > 0 || summary.payments > 0;

  if (hasBilling) {
    if (ctx.role !== "admin") {
      return {
        error:
          "El alumno tiene cobros o pagos registrados. Solo un administrador puede eliminarlo; si dejó el colegio, márcalo como Retirado.",
      };
    }
    if (confirmCode?.trim() !== student.code) {
      return { error: "El código ingresado no coincide con el del alumno." };
    }

    const { data: invoices } = await supabase
      .from("invoices")
      .select("id")
      .eq("student_id", studentId);
    const invoiceIds = (invoices ?? []).map((inv) => inv.id);

    // Comprobantes emitidos a nombre del alumno, más cualquier otro que haya
    // pagado alguno de sus cobros (p. ej. un comprobante de un hermano).
    const { data: ownDocs } = await supabase
      .from("payment_documents")
      .select("id")
      .eq("student_id", studentId);
    const { data: linkedItems } = invoiceIds.length
      ? await supabase
          .from("payment_document_items")
          .select("document_id")
          .in("invoice_id", invoiceIds)
      : { data: [] };
    const documentIds = [
      ...new Set([
        ...(ownDocs ?? []).map((d) => d.id),
        ...(linkedItems ?? []).map((i) => i.document_id),
      ]),
    ];

    if (documentIds.length) {
      const { error } = await supabase
        .from("payment_documents")
        .delete()
        .in("id", documentIds);
      if (error) {
        return { error: "No se pudieron eliminar los pagos del alumno." };
      }
    }

    if (invoiceIds.length) {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .in("id", invoiceIds);
      if (error) {
        return { error: "No se pudieron eliminar los cobros del alumno." };
      }
    }
  }

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId)
    .eq("school_id", ctx.schoolId);

  if (error) {
    return { error: "No se pudo eliminar el alumno." };
  }

  revalidatePath("/alumnos");
  return undefined;
}

// ---------------------------------------------------------------------------
// Apoderados vinculados (sub-pestaña dentro de Mantenimiento de Alumnos)
// ---------------------------------------------------------------------------

export async function linkExistingGuardian(
  studentId: string,
  guardianId: string,
  relationshipType: RelationshipType
) {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para vincular apoderados." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("student_guardians").insert({
    student_id: studentId,
    guardian_id: guardianId,
    relationship_type: relationshipType,
  });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "Ese apoderado ya está vinculado a este alumno."
          : "No se pudo vincular al apoderado.",
    };
  }

  revalidatePath("/alumnos");
  return undefined;
}

export async function createAndLinkGuardian(
  studentId: string,
  formData: FormData
) {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para crear apoderados." };
  }

  const first_names = str(formData, "guardian_first_names");
  const paternal_surname = str(formData, "guardian_paternal_surname");
  const relationship_type = str(
    formData,
    "guardian_relationship_type"
  ) as RelationshipType | null;

  if (!first_names || !relationship_type) {
    return { error: "Nombre y parentesco del apoderado son obligatorios." };
  }

  const supabase = await createClient();
  const { data: guardian, error: guardianError } = await supabase
    .from("guardians")
    .insert({
      school_id: ctx.schoolId,
      first_names,
      paternal_surname,
      maternal_surname: str(formData, "guardian_maternal_surname"),
      phone: str(formData, "guardian_phone"),
      email: str(formData, "guardian_email"),
    })
    .select("id")
    .single();

  if (guardianError || !guardian) {
    return { error: "No se pudo crear el apoderado." };
  }

  const { error: linkError } = await supabase.from("student_guardians").insert({
    student_id: studentId,
    guardian_id: guardian.id,
    relationship_type,
  });

  if (linkError) {
    return { error: "El apoderado se creó pero no se pudo vincular." };
  }

  revalidatePath("/alumnos");
  return undefined;
}

export async function unlinkGuardian(studentId: string, guardianId: string) {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para desvincular apoderados." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("student_guardians")
    .delete()
    .eq("student_id", studentId)
    .eq("guardian_id", guardianId);

  if (error) {
    return { error: "No se pudo desvincular al apoderado." };
  }

  revalidatePath("/alumnos");
  return undefined;
}

// ---------------------------------------------------------------------------
// Generar cobros del año (matrícula + pensiones según tuition_schedule)
// ---------------------------------------------------------------------------

function lastDayOf(year: number, month: number) {
  // new Date(year, month, 0) da el último día del mes anterior a `month`
  // (0-indexed), es decir el último día de `month` en notación 1-indexed.
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

export async function generateYearlyInvoices(
  studentId: string,
  academicYear: number
): Promise<{ error: string } | { created: number; skipped: number }> {
  const ctx = await requireAppContext();
  if (!ctx.schoolId || !CAN_WRITE_ROLES.includes(ctx.role ?? "")) {
    return { error: "No tienes permiso para generar cobros." };
  }

  const supabase = await createClient();

  // El alumno viene del cliente: confirmamos que pertenece a este colegio
  // antes de generar nada (no confiar en el student_id tal cual).
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", studentId)
    .eq("school_id", ctx.schoolId)
    .maybeSingle();

  if (!student) {
    return { error: "Alumno no encontrado." };
  }

  const { data: schedule } = await supabase
    .from("tuition_schedule")
    .select("*")
    .eq("school_id", ctx.schoolId)
    .eq("academic_year", academicYear);

  if (!schedule || schedule.length === 0) {
    return {
      error: `No hay lista de precios configurada para ${academicYear}. Ve a Configuración → Lista de Precios.`,
    };
  }

  const { data: existingInvoices } = await supabase
    .from("invoices")
    .select("concept_type, month")
    .eq("student_id", studentId)
    .eq("academic_year", academicYear);

  const existingKeys = new Set(
    (existingInvoices ?? []).map(
      (inv) => `${inv.concept_type}:${inv.month ?? "null"}`
    )
  );

  const toInsert = schedule
    .filter(
      (row) => !existingKeys.has(`${row.concept_type}:${row.month ?? "null"}`)
    )
    .map((row) => {
      const description =
        row.concept_type === "matricula"
          ? `Matrícula ${academicYear}`
          : `Pensión ${MONTH_LABELS[row.month! - 1]} ${academicYear}`;
      // Sin un campo de "día de vencimiento" configurable en el schema,
      // usamos fin de febrero para matrícula (antes de iniciar clases en
      // marzo) y fin del mes correspondiente para cada pensión.
      const dueDate =
        row.concept_type === "matricula"
          ? lastDayOf(academicYear, 2)
          : lastDayOf(academicYear, row.month!);

      return {
        school_id: ctx.schoolId!,
        student_id: studentId,
        schedule_id: row.id,
        academic_year: academicYear,
        concept_type: row.concept_type,
        month: row.month,
        description,
        currency: row.currency,
        amount: row.amount,
        due_date: dueDate,
      };
    });

  if (toInsert.length === 0) {
    return { created: 0, skipped: schedule.length };
  }

  const { error } = await supabase.from("invoices").insert(toInsert);
  if (error) {
    return { error: "No se pudieron generar los cobros." };
  }

  revalidatePath("/alumnos");
  return { created: toInsert.length, skipped: schedule.length - toInsert.length };
}
