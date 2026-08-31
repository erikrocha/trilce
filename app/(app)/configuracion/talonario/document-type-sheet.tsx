"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/lib/supabase/database.types";
import {
  addDocumentSeries,
  createDocumentType,
  toggleDocumentSeriesActive,
  updateDocumentType,
  type DocumentType,
  type FormState,
} from "./actions";

type DocumentSeries = Database["public"]["Tables"]["document_series"]["Row"];
type DocumentTypeWithSeries = DocumentType & {
  document_series: DocumentSeries[];
};

export function DocumentTypeSheet({
  documentType,
  open,
  onOpenChange,
  onCreated,
  readOnly,
}: {
  documentType: DocumentTypeWithSeries | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (documentType: DocumentType) => void;
  readOnly: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {open && (
          <DocumentTypeSheetBody
            key={documentType?.id ?? "new"}
            documentType={documentType}
            readOnly={readOnly}
            onSaved={() => onOpenChange(false)}
            onCreated={onCreated}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DocumentTypeSheetBody({
  documentType,
  readOnly,
  onSaved,
  onCreated,
}: {
  documentType: DocumentTypeWithSeries | null;
  readOnly: boolean;
  onSaved: () => void;
  onCreated: (documentType: DocumentType) => void;
}) {
  const action = documentType
    ? updateDocumentType.bind(null, documentType.id)
    : createDocumentType;
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
    if (!submittedRef.current || !state) return;
    if ("documentType" in state) {
      onCreated(state.documentType);
    } else if (!("error" in state)) {
      onSaved();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          {documentType ? "Editar tipo de documento" : "Nuevo tipo de documento"}
        </SheetTitle>
        <SheetDescription>
          {documentType
            ? documentType.name
            : "Boleta, factura, u otro documento de cobro."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-4">
        <form
          id="document-type-form"
          action={formAction}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              defaultValue={documentType?.name}
              disabled={readOnly}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="short_code">Código corto</Label>
            <Input
              id="short_code"
              name="short_code"
              placeholder="Ej. B, F"
              defaultValue={documentType?.short_code ?? ""}
              disabled={readOnly}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="is_electronic">Documento electrónico</Label>
            <Switch
              id="is_electronic"
              name="is_electronic"
              defaultChecked={documentType?.is_electronic}
              disabled={readOnly}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="requires_igv">Requiere IGV</Label>
            <Switch
              id="requires_igv"
              name="requires_igv"
              defaultChecked={documentType?.requires_igv}
              disabled={readOnly}
            />
          </div>
          {documentType && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="active">Activo</Label>
              <Switch
                id="active"
                name="active"
                defaultChecked={documentType.active}
                disabled={readOnly}
              />
            </div>
          )}

          {state && "error" in state && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </form>

        {documentType && (
          <SeriesSection documentType={documentType} readOnly={readOnly} />
        )}
      </div>

      {!readOnly && (
        <SheetFooter>
          <Button type="submit" form="document-type-form" disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </SheetFooter>
      )}
    </>
  );
}

function SeriesSection({
  documentType,
  readOnly,
}: {
  documentType: DocumentTypeWithSeries;
  readOnly: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAddSeries(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addDocumentSeries(documentType.id, formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleToggle(seriesId: string, active: boolean) {
    startTransition(async () => {
      await toggleDocumentSeriesActive(seriesId, active);
    });
  }

  return (
    <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4">
      <h3 className="text-sm font-medium">Series</h3>
      {documentType.document_series.length === 0 && (
        <p className="text-sm text-muted-foreground">Sin series todavía.</p>
      )}
      {documentType.document_series.map((series) => (
        <div
          key={series.id}
          className="flex items-center justify-between rounded-lg border border-border p-2.5"
        >
          <div>
            <p className="font-mono text-sm">{series.series_code}</p>
            <p className="text-xs text-muted-foreground">
              Próximo correlativo: {series.next_correlative}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={series.active ? "default" : "secondary"}>
              {series.active ? "Activa" : "Inactiva"}
            </Badge>
            {!readOnly && (
              <Switch
                checked={series.active}
                disabled={isPending}
                onCheckedChange={(checked) =>
                  handleToggle(series.id, checked)
                }
              />
            )}
          </div>
        </div>
      ))}

      {!readOnly && (
        <form action={handleAddSeries} className="flex items-end gap-2 pt-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="series_code">Nueva serie</Label>
            <Input
              id="series_code"
              name="series_code"
              placeholder="001"
              required
            />
          </div>
          <Button type="submit" size="sm" disabled={isPending}>
            Agregar
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
