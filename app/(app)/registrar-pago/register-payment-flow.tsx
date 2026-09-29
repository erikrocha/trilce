"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { createClient } from "@/lib/supabase/client";
import { CONCEPT_TYPE_LABELS, RELATIONSHIP_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";
import { registerPayment } from "./actions";

type Student = Database["public"]["Tables"]["students"]["Row"];
type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
type Guardian = Database["public"]["Tables"]["guardians"]["Row"];
type GuardianLink = Database["public"]["Tables"]["student_guardians"]["Row"] & {
  guardians: Guardian;
};
type PaymentOrigin = Database["public"]["Tables"]["payment_origins"]["Row"];
type DocumentSeries = { id: string; series_code: string; active: boolean };
type DocumentType = {
  id: string;
  name: string;
  requires_igv: boolean;
  document_series: DocumentSeries[];
};

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

const PENDING_STATUSES = ["pendiente", "parcial", "vencido"] as const;

function studentName(s: Student) {
  return `${s.paternal_surname} ${s.maternal_surname ?? ""}, ${s.first_names}`;
}

export function RegisterPaymentFlow({
  documentTypes,
  origins,
}: {
  documentTypes: DocumentType[];
  origins: PaymentOrigin[];
}) {
  const [step, setStep] = useState<"alumno" | "documento" | "confirmar">(
    "alumno"
  );

  // Paso 1: alumno y boletas
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [guardianLinks, setGuardianLinks] = useState<GuardianLink[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  // Paso 2: documento y origen
  const [seriesId, setSeriesId] = useState("");
  const [originId, setOriginId] = useState("");
  const [guardianId, setGuardianId] = useState<string>("__none__");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    documentId: string;
    correlativeLabel: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    const handle = setTimeout(() => {
      supabase
        .from("students")
        .select("*")
        .or(
          `first_names.ilike.%${query}%,paternal_surname.ilike.%${query}%,code.ilike.%${query}%`
        )
        .neq("status", "inactivo")
        .limit(8)
        .then(({ data }) => {
          if (!cancelled) setResults(data ?? []);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  function selectStudent(s: Student) {
    setStudent(s);
    setResults([]);
    setQuery("");
    setAmounts({});
    const supabase = createClient();
    supabase
      .from("invoices")
      .select("*")
      .eq("student_id", s.id)
      .in("status", PENDING_STATUSES)
      .order("due_date", { ascending: true })
      .then(({ data }) => setInvoices(data ?? []));
    supabase
      .from("student_guardians")
      .select("*, guardians(*)")
      .eq("student_id", s.id)
      .then(({ data }) => {
        const links = (data as GuardianLink[] | null) ?? [];
        setGuardianLinks(links);
        const billingResponsible = links.find((l) => l.is_billing_responsible);
        setGuardianId(billingResponsible?.guardian_id ?? "__none__");
      });
  }

  function toggleInvoice(invoice: Invoice, checked: boolean) {
    setAmounts((prev) => {
      const next = { ...prev };
      if (checked) {
        next[invoice.id] = String(invoice.balance ?? 0);
      } else {
        delete next[invoice.id];
      }
      return next;
    });
  }

  const selectedItems = useMemo(
    () =>
      Object.entries(amounts)
        .map(([invoiceId, amount]) => ({
          invoiceId,
          amount: Number(amount),
          invoice: invoices.find((i) => i.id === invoiceId)!,
        }))
        .filter((item) => item.invoice && Number.isFinite(item.amount)),
    [amounts, invoices]
  );

  const total = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.amount, 0),
    [selectedItems]
  );

  const selectedType = documentTypes.find((dt) =>
    dt.document_series.some((s) => s.id === seriesId)
  );
  const activeSeriesOptions = documentTypes.flatMap((dt) =>
    dt.document_series
      .filter((s) => s.active)
      .map((s) => ({ ...s, typeName: dt.name }))
  );

  const canGoToDocumento = !!student && selectedItems.length > 0;
  const selectedOrigin = origins.find((o) => o.id === originId);
  const canGoToConfirmar =
    canGoToDocumento &&
    !!seriesId &&
    !!originId &&
    !!paymentDate &&
    (!selectedOrigin?.requires_reference || reference.trim().length > 0);

  function handleSubmit() {
    if (!student) return;
    setError(null);
    startTransition(async () => {
      const outcome = await registerPayment({
        studentId: student.id,
        guardianId: guardianId === "__none__" ? null : guardianId,
        seriesId,
        originId,
        reference: reference.trim() || null,
        paymentDate,
        items: selectedItems.map((i) => ({
          invoiceId: i.invoiceId,
          amount: i.amount,
        })),
      });
      if ("error" in outcome) {
        setError(outcome.error);
      } else {
        setResult(outcome);
      }
    });
  }

  function handleReset() {
    setStep("alumno");
    setQuery("");
    setResults([]);
    setStudent(null);
    setGuardianLinks([]);
    setInvoices([]);
    setAmounts({});
    setSeriesId("");
    setOriginId("");
    setGuardianId("__none__");
    setReference("");
    setError(null);
    setResult(null);
  }

  if (result) {
    return (
      <Card className="max-w-md p-6 text-center">
        <p className="text-sm text-muted-foreground">Pago registrado</p>
        <p className="mt-1 font-mono text-lg">{result.correlativeLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {currencyFormatter.format(total)}
        </p>
        <Button className="mt-4" onClick={handleReset}>
          Registrar otro pago
        </Button>
      </Card>
    );
  }

  return (
    <Tabs
      value={step}
      onValueChange={(v) => setStep(v as typeof step)}
      className="max-w-2xl"
    >
      <TabsList variant="line">
        <TabsTrigger value="alumno">1. Alumno y boletas</TabsTrigger>
        <TabsTrigger value="documento" disabled={!canGoToDocumento}>
          2. Documento y origen
        </TabsTrigger>
        <TabsTrigger value="confirmar" disabled={!canGoToConfirmar}>
          3. Confirmar
        </TabsTrigger>
      </TabsList>

      <TabsContent value="alumno" className="flex flex-col gap-4 pt-4">
        {!student ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="student-search">Buscar alumno</Label>
            <Input
              id="student-search"
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                if (value.trim().length < 2) setResults([]);
              }}
              placeholder="Nombre, apellido o código"
            />
            {results.length > 0 && (
              <div className="flex flex-col gap-1 rounded-lg border border-border p-1">
                {results.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => selectStudent(s)}
                  >
                    {studentName(s)}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      {s.code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">{studentName(student)}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {student.code}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStudent(null)}>
              Cambiar
            </Button>
          </div>
        )}

        {student && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Boletas pendientes</p>
            {invoices.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Este alumno no tiene boletas pendientes.
              </p>
            )}
            {invoices.map((invoice) => {
              const checked = invoice.id in amounts;
              return (
                <div
                  key={invoice.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleInvoice(invoice, e.target.checked)}
                    className="size-4"
                  />
                  <div className="flex-1">
                    <p className="text-sm">{invoice.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Saldo: {currencyFormatter.format(invoice.balance ?? 0)}
                    </p>
                  </div>
                  <InvoiceStatusBadge status={invoice.status} />
                  {checked && (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max={invoice.balance ?? undefined}
                      value={amounts[invoice.id]}
                      onChange={(e) =>
                        setAmounts((prev) => ({
                          ...prev,
                          [invoice.id]: e.target.value,
                        }))
                      }
                      className="w-28"
                    />
                  )}
                </div>
              );
            })}
            {selectedItems.length > 0 && (
              <p className="text-right text-sm font-medium">
                Total: {currencyFormatter.format(total)}
              </p>
            )}
          </div>
        )}

        <Button
          className="self-end"
          disabled={!canGoToDocumento}
          onClick={() => setStep("documento")}
        >
          Siguiente
        </Button>
      </TabsContent>

      <TabsContent value="documento" className="flex flex-col gap-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Tipo y serie de documento</Label>
            <Select value={seriesId} onValueChange={(v) => setSeriesId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {activeSeriesOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.typeName} — {s.series_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Origen de pago</Label>
            <Select value={originId} onValueChange={(v) => setOriginId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {origins.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payment-date">Fecha de pago</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reference">
              N° de referencia
              {selectedOrigin?.requires_reference ? "" : " (opcional)"}
            </Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Responsable de pago</Label>
            <Select value={guardianId} onValueChange={(v) => setGuardianId(v ?? "__none__")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Ninguno</SelectItem>
                {guardianLinks.map((link) => (
                  <SelectItem key={link.guardian_id} value={link.guardian_id}>
                    {link.guardians.paternal_surname}{" "}
                    {link.guardians.maternal_surname ?? ""},{" "}
                    {link.guardians.first_names} (
                    {RELATIONSHIP_LABELS[link.relationship_type]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("alumno")}>
            Atrás
          </Button>
          <Button
            disabled={!canGoToConfirmar}
            onClick={() => setStep("confirmar")}
          >
            Siguiente
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="confirmar" className="flex flex-col gap-4 pt-4">
        <div className="rounded-lg border border-border p-3 text-sm">
          <p>
            <span className="text-muted-foreground">Alumno:</span>{" "}
            {student && studentName(student)}
          </p>
          <p>
            <span className="text-muted-foreground">Documento:</span>{" "}
            {selectedType?.name} —{" "}
            {selectedType?.document_series.find((s) => s.id === seriesId)
              ?.series_code}
          </p>
          <p>
            <span className="text-muted-foreground">Origen:</span>{" "}
            {selectedOrigin?.name}
            {reference && ` (ref. ${reference})`}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {selectedItems.map((item) => (
            <div
              key={item.invoiceId}
              className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm"
            >
              <span>
                {CONCEPT_TYPE_LABELS[item.invoice.concept_type]} —{" "}
                {item.invoice.description}
              </span>
              <span className="font-mono">
                {currencyFormatter.format(item.amount)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-medium">
            <span>Total a pagar</span>
            <span className="font-mono">
              {currencyFormatter.format(total)}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("documento")}>
            Atrás
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Registrando…" : "Confirmar y registrar pago"}
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
