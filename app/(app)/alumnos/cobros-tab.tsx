"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { createClient } from "@/lib/supabase/client";
import { CONCEPT_TYPE_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";
import { generateYearlyInvoices } from "./actions";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

const currencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
});

export function CobrosTab({ studentId }: { studentId: string }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [result, setResult] = useState<
    { error: string } | { created: number; skipped: number } | null
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("invoices")
      .select("*")
      .eq("student_id", studentId)
      .order("academic_year", { ascending: false })
      .order("month", { ascending: true, nullsFirst: true })
      .then(({ data }) => {
        if (!cancelled) setInvoices(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, refreshKey]);

  function handleGenerate() {
    setResult(null);
    startTransition(async () => {
      const outcome = await generateYearlyInvoices(studentId, year);
      setResult(outcome);
      if (!("error" in outcome)) {
        setRefreshKey((k) => k + 1);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end gap-2 rounded-lg border border-border p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cobros-year">Año lectivo</Label>
          <Input
            id="cobros-year"
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || currentYear)}
            className="w-28"
          />
        </div>
        <Button type="button" onClick={handleGenerate} disabled={isPending}>
          {isPending ? "Generando…" : "Generar cobros del año"}
        </Button>
      </div>

      {result && "error" in result && (
        <p className="text-sm text-destructive">{result.error}</p>
      )}
      {result && "created" in result && (
        <p className="text-sm text-muted-foreground">
          {result.created > 0
            ? `Se generaron ${result.created} cobro(s).`
            : "No había cobros nuevos por generar."}
          {result.skipped > 0 &&
            ` (${result.skipped} ya existían y se omitieron.)`}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {invoices.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Este alumno todavía no tiene cobros generados.
          </p>
        )}
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="flex items-center justify-between rounded-lg border border-border p-2.5"
          >
            <div>
              <p className="text-sm">{invoice.description}</p>
              <p className="text-xs text-muted-foreground">
                {CONCEPT_TYPE_LABELS[invoice.concept_type]} ·{" "}
                {invoice.academic_year} · vence{" "}
                {new Date(invoice.due_date).toLocaleDateString("es-PE")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm">
                {currencyFormatter.format(invoice.amount)}
              </span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
