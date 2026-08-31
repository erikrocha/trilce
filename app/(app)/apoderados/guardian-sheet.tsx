"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { TrashIcon } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DOCUMENT_TYPE_LABELS, SEX_LABELS } from "@/lib/enum-labels";
import {
  createGuardian,
  deleteGuardian,
  updateGuardian,
  type FormState,
  type Guardian,
} from "./actions";

export function GuardianSheet({
  guardian,
  open,
  onOpenChange,
  readOnly,
}: {
  guardian: Guardian | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {open && (
          <GuardianSheetBody
            key={guardian?.id ?? "new"}
            guardian={guardian}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function GuardianSheetBody({
  guardian,
  readOnly,
  onSaved,
}: {
  guardian: Guardian | null;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const action = guardian
    ? updateGuardian.bind(null, guardian.id)
    : createGuardian;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const submittedRef = useRef(false);
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
    } else if (submittedRef.current && !state?.error) {
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function handleDelete() {
    if (!guardian) return;
    startDelete(async () => {
      const result = await deleteGuardian(guardian.id);
      if (result?.error) {
        setDeleteError(result.error);
        return;
      }
      onSaved();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {guardian ? "Editar apoderado" : "Nuevo apoderado"}
        </SheetTitle>
        <SheetDescription>
          {guardian
            ? `${guardian.paternal_surname ?? ""} ${guardian.maternal_surname ?? ""}, ${guardian.first_names}`
            : "Completa los datos del apoderado."}
        </SheetDescription>
      </SheetHeader>

      <Tabs defaultValue="personal" className="flex-1 overflow-y-auto px-4">
        <TabsList variant="line">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="contacto">Contacto</TabsTrigger>
          <TabsTrigger value="laboral">Laboral</TabsTrigger>
        </TabsList>

        <form id="guardian-form" action={formAction}>
          <TabsContent value="personal" keepMounted className="grid grid-cols-2 gap-3 pt-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="first_names">Nombres</Label>
              <Input
                id="first_names"
                name="first_names"
                defaultValue={guardian?.first_names}
                disabled={readOnly}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paternal_surname">Apellido paterno</Label>
              <Input
                id="paternal_surname"
                name="paternal_surname"
                defaultValue={guardian?.paternal_surname ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maternal_surname">Apellido materno</Label>
              <Input
                id="maternal_surname"
                name="maternal_surname"
                defaultValue={guardian?.maternal_surname ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sexo</Label>
              <Select
                name="sex"
                defaultValue={guardian?.sex ?? undefined}
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
                defaultValue={guardian?.birth_date ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tipo de documento</Label>
              <Select
                name="document_type"
                defaultValue={guardian?.document_type ?? "DNI"}
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
                defaultValue={guardian?.document_number ?? ""}
                disabled={readOnly}
              />
            </div>
          </TabsContent>

          <TabsContent value="contacto" keepMounted className="grid grid-cols-2 gap-3 pt-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                name="address"
                defaultValue={guardian?.address ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Teléfono fijo</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={guardian?.phone ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mobile">Celular</Label>
              <Input
                id="mobile"
                name="mobile"
                defaultValue={guardian?.mobile ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={guardian?.email ?? ""}
                disabled={readOnly}
              />
            </div>
          </TabsContent>

          <TabsContent value="laboral" keepMounted className="grid grid-cols-2 gap-3 pt-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="education_level">Nivel educativo</Label>
              <Input
                id="education_level"
                name="education_level"
                defaultValue={guardian?.education_level ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profession">Profesión</Label>
              <Input
                id="profession"
                name="profession"
                defaultValue={guardian?.profession ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="job_title">Cargo</Label>
              <Input
                id="job_title"
                name="job_title"
                defaultValue={guardian?.job_title ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="workplace">Centro de trabajo</Label>
              <Input
                id="workplace"
                name="workplace"
                defaultValue={guardian?.workplace ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="work_phone">Teléfono de trabajo</Label>
              <Input
                id="work_phone"
                name="work_phone"
                defaultValue={guardian?.work_phone ?? ""}
                disabled={readOnly}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="work_address">Dirección de trabajo</Label>
              <Input
                id="work_address"
                name="work_address"
                defaultValue={guardian?.work_address ?? ""}
                disabled={readOnly}
              />
            </div>
          </TabsContent>
        </form>
      </Tabs>

      <div className="px-4">
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {deleteError && (
          <p className="text-sm text-destructive">{deleteError}</p>
        )}
      </div>

      {!readOnly && (
        <SheetFooter className="flex-row justify-between">
          {guardian ? (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button type="button" variant="outline" disabled={isDeleting} />
                }
              >
                <TrashIcon />
                Eliminar
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar apoderado?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se quitará su vínculo con cualquier alumno. Esta acción no
                    se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleDelete}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span />
          )}
          <Button type="submit" form="guardian-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
