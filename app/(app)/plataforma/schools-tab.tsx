"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { SCHOOL_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";
import {
  createSchool,
  softDeleteSchool,
  updateSchoolStatus,
  updateSubscription,
  type FormState,
} from "./actions";

type Plan = Database["public"]["Tables"]["plans"]["Row"];
type SchoolStatus = Database["public"]["Enums"]["school_status"];
type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
type School = Database["public"]["Tables"]["schools"]["Row"] & {
  subscriptions: {
    id: string;
    status: string;
    plan_id: string;
    current_period_end: string | null;
    plans: { name: string } | null;
  }[];
};

const STATUS_BADGE_VARIANT: Record<string, "default" | "outline" | "secondary"> = {
  trial: "outline",
  active: "default",
  past_due: "secondary",
  suspended: "secondary",
};

export function SchoolsTab({
  schools,
  plans,
}: {
  schools: School[];
  plans: Plan[];
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<School | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon />
            Nuevo colegio
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Suscripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((school) => {
              const sub = school.subscriptions[0];
              return (
                <TableRow
                  key={school.id}
                  className="cursor-pointer"
                  onClick={() => setEditing(school)}
                >
                  <TableCell>{school.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE_VARIANT[school.status]}>
                      {SCHOOL_STATUS_LABELS[school.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{sub?.plans?.name ?? "—"}</TableCell>
                  <TableCell>
                    {sub ? SUBSCRIPTION_STATUS_LABELS[sub.status] : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <NewSchoolSheet
        open={creating}
        onOpenChange={setCreating}
        plans={plans}
      />
      <EditSchoolSheet
        school={editing}
        plans={plans}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </>
  );
}

function NewSchoolSheet({
  open,
  onOpenChange,
  plans,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    createSchool,
    undefined
  );
  const submittedRef = useRef(false);
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
    } else if (submittedRef.current && !state?.error) {
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nuevo colegio</SheetTitle>
          <SheetDescription>
            Crea el colegio con su catálogo (talonario, orígenes de pago) por
            defecto.
          </SheetDescription>
        </SheetHeader>
        <form
          id="school-form"
          action={formAction}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" name="slug" placeholder="mi-colegio" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Tipo</Label>
            <Select name="school_type" defaultValue="privado">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="privado">Privado</SelectItem>
                <SelectItem value="publico">Público</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Plan</Label>
            <Select name="plan_id">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </form>
        <SheetFooter>
          <Button type="submit" form="school-form" disabled={pending}>
            {pending ? "Creando…" : "Crear colegio"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function EditSchoolSheet({
  school,
  plans,
  open,
  onOpenChange,
}: {
  school: School | null;
  plans: Plan[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && school && (
          <EditSchoolBody
            key={school.id}
            school={school}
            plans={plans}
            onDeleted={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EditSchoolBody({
  school,
  plans,
  onDeleted,
}: {
  school: School;
  plans: Plan[];
  onDeleted: () => void;
}) {
  const sub = school.subscriptions[0];
  const [status, setStatus] = useState<SchoolStatus>(school.status);
  const [suspendedReason, setSuspendedReason] = useState(
    school.suspended_reason ?? ""
  );
  const [planId, setPlanId] = useState(sub?.plan_id ?? "");
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>(
    (sub?.status as SubscriptionStatus) ?? "trialing"
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(value: string | null) {
    if (!value) return;
    const next = value as SchoolStatus;
    setStatus(next);
    startTransition(async () => {
      const result = await updateSchoolStatus(
        school.id,
        next,
        next === "suspended" ? suspendedReason : null
      );
      if (result?.error) setError(result.error);
    });
  }

  function handleSubscriptionSave() {
    if (!sub) return;
    startTransition(async () => {
      const result = await updateSubscription(sub.id, planId, subStatus);
      if (result?.error) setError(result.error);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await softDeleteSchool(school.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      onDeleted();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{school.name}</SheetTitle>
        <SheetDescription>{school.slug ?? "Sin slug"}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        <div className="flex flex-col gap-1.5">
          <Label>Estado del colegio</Label>
          <Select value={status} onValueChange={handleStatusChange} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SCHOOL_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {status === "suspended" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="suspended_reason">Motivo de suspensión</Label>
            <Input
              id="suspended_reason"
              value={suspendedReason}
              onChange={(e) => setSuspendedReason(e.target.value)}
              onBlur={() =>
                startTransition(async () => {
                  const result = await updateSchoolStatus(
                    school.id,
                    "suspended",
                    suspendedReason
                  );
                  if (result?.error) setError(result.error);
                })
              }
            />
          </div>
        )}

        {sub && (
          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Suscripción</p>
            <div className="flex flex-col gap-1.5">
              <Label>Plan</Label>
              <Select value={planId} onValueChange={(v) => setPlanId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Estado de suscripción</Label>
              <Select
                value={subStatus}
                onValueChange={(v) => setSubStatus((v as SubscriptionStatus) ?? "trialing")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={handleSubscriptionSave}
            >
              Guardar suscripción
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <SheetFooter>
        <AlertDialog>
          <AlertDialogTrigger
            render={<Button type="button" variant="outline" disabled={isPending} />}
          >
            Eliminar colegio
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar {school.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Es un borrado lógico (se marca `deleted_at`) — los datos
                tributarios/legales no se destruyen.
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
      </SheetFooter>
    </>
  );
}
