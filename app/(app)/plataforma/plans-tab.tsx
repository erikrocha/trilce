"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import type { Database } from "@/lib/supabase/database.types";
import { createPlan, updatePlan, type FormState } from "./actions";

type Plan = Database["public"]["Tables"]["plans"]["Row"];

const PRICING_MODEL_LABELS: Record<string, string> = {
  free: "Gratis",
  per_student: "Por alumno",
  fixed: "Fijo",
};

export function PlansTab({ plans }: { plans: Plan[] }) {
  const [sheetPlan, setSheetPlan] = useState<Plan | "new" | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          <Button size="sm" onClick={() => setSheetPlan("new")}>
            <PlusIcon />
            Nuevo plan
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow
                key={plan.id}
                className="cursor-pointer"
                onClick={() => setSheetPlan(plan)}
              >
                <TableCell>{plan.name}</TableCell>
                <TableCell>{PRICING_MODEL_LABELS[plan.pricing_model]}</TableCell>
                <TableCell className="font-mono text-xs">
                  {plan.pricing_model === "per_student" && plan.price_per_student
                    ? `S/ ${plan.price_per_student}/alumno`
                    : plan.pricing_model === "fixed" && plan.fixed_price
                      ? `S/ ${plan.fixed_price}`
                      : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={plan.active ? "default" : "secondary"}>
                    {plan.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet
        open={sheetPlan !== null}
        onOpenChange={(open) => !open && setSheetPlan(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {sheetPlan && (
            <PlanForm
              key={sheetPlan === "new" ? "new" : sheetPlan.id}
              plan={sheetPlan === "new" ? null : sheetPlan}
              onSaved={() => setSheetPlan(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function PlanForm({ plan, onSaved }: { plan: Plan | null; onSaved: () => void }) {
  const action = plan ? updatePlan.bind(null, plan.id) : createPlan;
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );
  const submittedRef = useRef(false);
  useEffect(() => {
    if (pending) {
      submittedRef.current = true;
    } else if (submittedRef.current && !state?.error) {
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{plan ? "Editar plan" : "Nuevo plan"}</SheetTitle>
        <SheetDescription>
          {plan ? plan.name : "Los 3 planes reales viven en el seed — usa esto para ajustes."}
        </SheetDescription>
      </SheetHeader>
      <form
        id="plan-form"
        action={formAction}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        {!plan && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Código</Label>
            <Input id="code" name="code" required />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" defaultValue={plan?.name} required />
        </div>
        {!plan && (
          <div className="flex flex-col gap-1.5">
            <Label>Modelo de precio</Label>
            <Select name="pricing_model" defaultValue="per_student">
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRICING_MODEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="price_per_student">Precio por alumno</Label>
            <Input
              id="price_per_student"
              name="price_per_student"
              type="number"
              step="0.01"
              defaultValue={plan?.price_per_student ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fixed_price">Precio fijo</Label>
            <Input
              id="fixed_price"
              name="fixed_price"
              type="number"
              step="0.01"
              defaultValue={plan?.fixed_price ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="max_students">Máx. alumnos</Label>
            <Input
              id="max_students"
              name="max_students"
              type="number"
              defaultValue={plan?.max_students ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="trial_days">Días de prueba</Label>
            <Input
              id="trial_days"
              name="trial_days"
              type="number"
              defaultValue={plan?.trial_days ?? ""}
            />
          </div>
        </div>
        {plan && (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="active">Activo</Label>
            <Switch id="active" name="active" defaultChecked={plan.active} />
          </div>
        )}
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </form>
      <SheetFooter>
        <Button type="submit" form="plan-form" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </SheetFooter>
    </>
  );
}
