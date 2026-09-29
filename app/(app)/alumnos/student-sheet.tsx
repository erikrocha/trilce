"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/database.types";
import {
  createStudent,
  updateStudent,
  type FormState,
  type StudentCredentials,
} from "./actions";
import {
  DOCUMENT_TYPE_LABELS,
  LEVEL_LABELS,
  SEX_LABELS,
  STUDENT_STATUS_LABELS,
} from "./labels";
import { GuardiansTab } from "./guardians-tab";
import { OtherDataTab } from "./other-data-tab";
import { CobrosTab } from "./cobros-tab";
import { DeleteStudentDialog } from "./delete-student-dialog";

type Student = Database["public"]["Tables"]["students"]["Row"];

export type CreatedInfo = {
  studentId: string;
  credentials?: StudentCredentials;
  loginError?: string;
};

export function StudentSheet({
  student,
  open,
  onOpenChange,
  onCreated,
  readOnly,
  canForceDelete,
  createdInfo,
}: {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (student: Student, info: CreatedInfo) => void;
  readOnly: boolean;
  canForceDelete: boolean;
  createdInfo: CreatedInfo | null;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {open && (
          <StudentSheetBody
            key={student?.id ?? "new"}
            student={student}
            readOnly={readOnly}
            canForceDelete={canForceDelete}
            createdInfo={
              createdInfo && createdInfo.studentId === student?.id
                ? createdInfo
                : null
            }
            onSaved={() => onOpenChange(false)}
            onCreated={onCreated}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function StudentSheetBody({
  student,
  readOnly,
  canForceDelete,
  createdInfo,
  onSaved,
  onCreated,
}: {
  student: Student | null;
  readOnly: boolean;
  canForceDelete: boolean;
  createdInfo: CreatedInfo | null;
  onSaved: () => void;
  onCreated: (student: Student, info: CreatedInfo) => void;
}) {
  const action = student
    ? updateStudent.bind(null, student.id)
    : createStudent;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  const submittedRef = useRef(false);
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
      return;
    }
    if (!submittedRef.current) return;
    if (state && "error" in state) return;
    if (state && "student" in state) {
      // El alumno se acaba de crear: dejamos el panel abierto pero pasamos a
      // modo edición (recién ahí existe un student_id para vincular apoderados).
      onCreated(state.student, {
        studentId: state.student.id,
        credentials: state.credentials,
        loginError: state.loginError,
      });
      return;
    }
    onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const currentYear = new Date().getFullYear();

  return (
    <>
      <SheetHeader>
        <SheetTitle>{student ? "Editar alumno" : "Nuevo alumno"}</SheetTitle>
        <SheetDescription>
          {student
            ? `${student.paternal_surname} ${student.maternal_surname ?? ""}, ${student.first_names}`
            : "Completa los datos del alumno."}
        </SheetDescription>
      </SheetHeader>

      {createdInfo?.credentials && (
        <div className="mx-4 flex flex-col gap-1 rounded-lg border border-border bg-muted/50 p-3 text-sm">
          <span className="font-medium">Acceso creado</span>
          <span>
            Usuario:{" "}
            <span className="font-mono">{createdInfo.credentials.username}</span>
          </span>
          <span>
            Correo:{" "}
            <span className="font-mono">{createdInfo.credentials.email}</span>
          </span>
          <span>
            Contraseña temporal:{" "}
            <span className="font-mono">
              {createdInfo.credentials.temp_password}
            </span>
          </span>
          <span className="text-xs text-muted-foreground">
            También aparece en Alumnos → Credenciales para imprimir.
          </span>
        </div>
      )}
      {createdInfo?.loginError && (
        <p className="mx-4 text-sm text-destructive">{createdInfo.loginError}</p>
      )}

      <Tabs defaultValue="datos" className="flex-1 overflow-y-auto px-4">
        <TabsList variant="line">
          <TabsTrigger value="datos">Datos</TabsTrigger>
          <TabsTrigger value="apoderados" disabled={!student}>
            Apoderados
          </TabsTrigger>
          <TabsTrigger value="cobros" disabled={!student || readOnly}>
            Cobros
          </TabsTrigger>
          <TabsTrigger value="otros" disabled={!student}>
            Otros datos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="datos" className="pt-4">
          <form id="student-form" action={formAction} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={student?.code}
                  disabled={readOnly}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="paternal_surname">Apellido paterno</Label>
                <Input
                  id="paternal_surname"
                  name="paternal_surname"
                  defaultValue={student?.paternal_surname}
                  disabled={readOnly}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="maternal_surname">Apellido materno</Label>
                <Input
                  id="maternal_surname"
                  name="maternal_surname"
                  defaultValue={student?.maternal_surname ?? ""}
                  disabled={readOnly}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="first_names">Nombres</Label>
                <Input
                  id="first_names"
                  name="first_names"
                  defaultValue={student?.first_names}
                  disabled={readOnly}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Sexo</Label>
                <Select
                  name="sex"
                  defaultValue={student?.sex ?? undefined}
                  disabled={readOnly}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SEX_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                <Input
                  id="birth_date"
                  name="birth_date"
                  type="date"
                  defaultValue={student?.birth_date ?? ""}
                  disabled={readOnly}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de documento</Label>
                <Select
                  name="document_type"
                  defaultValue={student?.document_type ?? "DNI"}
                  disabled={readOnly}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="document_number">N° de documento</Label>
                <Input
                  id="document_number"
                  name="document_number"
                  defaultValue={student?.document_number ?? ""}
                  disabled={readOnly}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Nivel</Label>
                <Select
                  name="level"
                  defaultValue={student?.level ?? undefined}
                  disabled={readOnly}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="grade">Grado</Label>
                <Input
                  id="grade"
                  name="grade"
                  defaultValue={student?.grade ?? ""}
                  disabled={readOnly}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="section">Sección</Label>
                <Input
                  id="section"
                  name="section"
                  defaultValue={student?.section ?? ""}
                  disabled={readOnly}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="entry_year">Año de ingreso</Label>
                <Input
                  id="entry_year"
                  name="entry_year"
                  type="number"
                  defaultValue={student?.entry_year ?? currentYear}
                  disabled={readOnly}
                />
              </div>
              {student && (
                <div className="flex flex-col gap-1.5">
                  <Label>Estado</Label>
                  <Select
                    name="status"
                    defaultValue={student.status}
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STUDENT_STATUS_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {state && "error" in state && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </form>
        </TabsContent>

        <TabsContent value="apoderados" className="pt-4">
          {student && <GuardiansTab studentId={student.id} readOnly={readOnly} />}
        </TabsContent>

        <TabsContent value="cobros" className="pt-4">
          {student && <CobrosTab studentId={student.id} />}
        </TabsContent>

        <TabsContent value="otros" className="pt-4">
          {student && <OtherDataTab studentId={student.id} />}
        </TabsContent>
      </Tabs>

      {!readOnly && (
        <SheetFooter className="flex-row justify-between">
          {student ? (
            <DeleteStudentDialog
              student={student}
              canForceDelete={canForceDelete}
              onDeleted={onSaved}
            />
          ) : (
            <span />
          )}
          <Button type="submit" form="student-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
