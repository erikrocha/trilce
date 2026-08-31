"use client";

import { useEffect, useState, useTransition } from "react";
import { XIcon } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { RELATIONSHIP_LABELS } from "./labels";
import {
  createAndLinkGuardian,
  linkExistingGuardian,
  unlinkGuardian,
} from "./actions";

type Guardian = Database["public"]["Tables"]["guardians"]["Row"];
type RelationshipType = Database["public"]["Enums"]["relationship_type"];
type LinkedGuardian = Database["public"]["Tables"]["student_guardians"]["Row"] & {
  guardians: Guardian;
};

export function GuardiansTab({
  studentId,
  readOnly,
}: {
  studentId: string;
  readOnly: boolean;
}) {
  const [linked, setLinked] = useState<LinkedGuardian[]>([]);
  const [mode, setMode] = useState<"search" | "create" | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Guardian[]>([]);
  const [selected, setSelected] = useState<Guardian | null>(null);
  const [relationship, setRelationship] = useState<RelationshipType | "">("");
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("student_guardians")
      .select("*, guardians(*)")
      .eq("student_id", studentId)
      .then(({ data }) => {
        if (!cancelled) setLinked((data as LinkedGuardian[] | null) ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, refreshKey]);

  useEffect(() => {
    if (mode !== "search" || query.trim().length < 2) {
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    const handle = setTimeout(() => {
      supabase
        .from("guardians")
        .select("*")
        .or(
          `first_names.ilike.%${query}%,paternal_surname.ilike.%${query}%,document_number.ilike.%${query}%`
        )
        .limit(5)
        .then(({ data }) => {
          if (!cancelled) setResults(data ?? []);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, mode]);

  function resetAddForm() {
    setMode(null);
    setQuery("");
    setResults([]);
    setSelected(null);
    setRelationship("");
    setError(null);
  }

  function handleLinkExisting() {
    if (!selected || !relationship) return;
    setError(null);
    startTransition(async () => {
      const result = await linkExistingGuardian(
        studentId,
        selected.id,
        relationship
      );
      if (result?.error) {
        setError(result.error);
        return;
      }
      resetAddForm();
      setRefreshKey((k) => k + 1);
    });
  }

  function handleCreateAndLink(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createAndLinkGuardian(studentId, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      resetAddForm();
      setRefreshKey((k) => k + 1);
    });
  }

  function handleUnlink(guardianId: string) {
    startTransition(async () => {
      await unlinkGuardian(studentId, guardianId);
      setRefreshKey((k) => k + 1);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {linked.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Este alumno todavía no tiene apoderados vinculados.
          </p>
        )}
        {linked.map((link) => (
          <div
            key={link.guardian_id}
            className="flex items-center justify-between rounded-lg border border-border p-2.5"
          >
            <div>
              <p className="text-sm">
                {link.guardians.paternal_surname}{" "}
                {link.guardians.maternal_surname ?? ""},{" "}
                {link.guardians.first_names}
              </p>
              <p className="text-xs text-muted-foreground">
                {RELATIONSHIP_LABELS[link.relationship_type]}
                {link.is_billing_responsible ? " · Responsable de pago" : ""}
                {link.lives_with ? " · Vive con el alumno" : ""}
              </p>
            </div>
            {!readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => handleUnlink(link.guardian_id)}
                disabled={isPending}
              >
                <XIcon />
              </Button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && mode === null && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMode("search")}
          >
            Vincular existente
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMode("create")}
          >
            Crear apoderado
          </Button>
        </div>
      )}

      {mode === "search" && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <Label htmlFor="guardian-search">Buscar por nombre o documento</Label>
          <Input
            id="guardian-search"
            value={query}
            onChange={(e) => {
              const value = e.target.value;
              setQuery(value);
              setSelected(null);
              if (value.trim().length < 2) setResults([]);
            }}
            placeholder="Ej. García"
          />
          {results.length > 0 && !selected && (
            <div className="flex flex-col gap-1">
              {results.map((guardian) => (
                <button
                  key={guardian.id}
                  type="button"
                  className="rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => setSelected(guardian)}
                >
                  {guardian.paternal_surname} {guardian.maternal_surname ?? ""}
                  , {guardian.first_names}
                </button>
              ))}
            </div>
          )}
          {selected && (
            <div className="flex items-end gap-2">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label>Parentesco</Label>
                <Select
                  value={relationship}
                  onValueChange={(v) => setRelationship(v as RelationshipType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RELATIONSHIP_LABELS).map(
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
                disabled={!relationship || isPending}
                onClick={handleLinkExisting}
              >
                Vincular
              </Button>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetAddForm}
          >
            Cancelar
          </Button>
        </div>
      )}

      {mode === "create" && (
        <form
          action={handleCreateAndLink}
          className="flex flex-col gap-2 rounded-lg border border-border p-3"
        >
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardian_first_names">Nombres</Label>
              <Input id="guardian_first_names" name="guardian_first_names" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardian_paternal_surname">Apellido paterno</Label>
              <Input
                id="guardian_paternal_surname"
                name="guardian_paternal_surname"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardian_maternal_surname">Apellido materno</Label>
              <Input
                id="guardian_maternal_surname"
                name="guardian_maternal_surname"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="guardian_phone">Teléfono</Label>
              <Input id="guardian_phone" name="guardian_phone" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="guardian_email">Correo</Label>
              <Input id="guardian_email" name="guardian_email" type="email" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label>Parentesco</Label>
              <Select name="guardian_relationship_type" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RELATIONSHIP_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              Crear y vincular
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetAddForm}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
