"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/database.types";
import { createMember } from "./actions";

type MembershipRole = Database["public"]["Enums"]["membership_role"];

const ROLE_OPTIONS: { value: MembershipRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "administrativo", label: "Administrativo" },
  { value: "docente", label: "Docente" },
  { value: "padre", label: "Padre/Apoderado" },
  { value: "alumno", label: "Alumno" },
];

const STAFF_ROLES: MembershipRole[] = ["admin", "administrativo", "docente"];

type StaffCandidate = { id: string; full_name: string; email: string | null };
type GuardianCandidate = {
  id: string;
  paternal_surname: string | null;
  maternal_surname: string | null;
  first_names: string;
  email: string | null;
};
type StudentCandidate = {
  id: string;
  code: string;
  paternal_surname: string;
  maternal_surname: string | null;
  first_names: string;
  institutional_email: string | null;
};

function guardianLabel(g: GuardianCandidate) {
  return `${g.paternal_surname ?? ""} ${g.maternal_surname ?? ""}, ${g.first_names}`;
}

function studentLabel(s: StudentCandidate) {
  return `${s.paternal_surname} ${s.maternal_surname ?? ""}, ${s.first_names} (${s.code})`;
}

export function NewMemberSheet({
  open,
  onOpenChange,
  availableStaff,
  availableGuardians,
  availableStudents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableStaff: StaffCandidate[];
  availableGuardians: GuardianCandidate[];
  availableStudents: StudentCandidate[];
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && (
          <NewMemberForm
            key={String(open)}
            availableStaff={availableStaff}
            availableGuardians={availableGuardians}
            availableStudents={availableStudents}
            onDone={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function NewMemberForm({
  availableStaff,
  availableGuardians,
  availableStudents,
  onDone,
}: {
  availableStaff: StaffCandidate[];
  availableGuardians: GuardianCandidate[];
  availableStudents: StudentCandidate[];
  onDone: () => void;
}) {
  const [role, setRole] = useState<MembershipRole | "">("");
  const [targetId, setTargetId] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pickTarget(id: string) {
    setTargetId(id);
    if (STAFF_ROLES.includes(role as MembershipRole)) {
      const s = availableStaff.find((x) => x.id === id);
      setEmail(s?.email ?? "");
      setUsername(
        s?.full_name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") ?? ""
      );
    } else if (role === "padre") {
      const g = availableGuardians.find((x) => x.id === id);
      setEmail(g?.email ?? "");
      setUsername(
        g ? guardianLabel(g).toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") : ""
      );
    } else if (role === "alumno") {
      const s = availableStudents.find((x) => x.id === id);
      setEmail(s?.institutional_email ?? "");
      setUsername(s?.code.toLowerCase() ?? "");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !targetId) {
      setError("Selecciona el rol y la persona.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const fullName =
        STAFF_ROLES.includes(role)
          ? availableStaff.find((s) => s.id === targetId)?.full_name ?? ""
          : role === "padre"
            ? guardianLabel(availableGuardians.find((g) => g.id === targetId)!)
            : studentLabel(availableStudents.find((s) => s.id === targetId)!);

      const result = await createMember({
        role,
        targetId,
        email,
        username,
        password,
        fullName,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      onDone();
    });
  }

  const targets =
    role === "padre"
      ? availableGuardians.map((g) => ({ id: g.id, label: guardianLabel(g) }))
      : role === "alumno"
        ? availableStudents.map((s) => ({ id: s.id, label: studentLabel(s) }))
        : role
          ? availableStaff.map((s) => ({ id: s.id, label: s.full_name }))
          : [];

  return (
    <>
      <SheetHeader>
        <SheetTitle>Nuevo miembro</SheetTitle>
        <SheetDescription>
          Crea el acceso al sistema para alguien que ya existe en Alumnos,
          Apoderados o Personal.
        </SheetDescription>
      </SheetHeader>

      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
      >
        <div className="flex flex-col gap-1.5">
          <Label>Rol</Label>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole((v as MembershipRole) ?? "");
              setTargetId("");
              setEmail("");
              setUsername("");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {role && (
          <div className="flex flex-col gap-1.5">
            <Label>
              {role === "padre" ? "Apoderado" : role === "alumno" ? "Alumno" : "Personal"}
            </Label>
            <Select value={targetId} onValueChange={(v) => pickTarget(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {targets.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No hay candidatos sin acceso todavía.
                  </div>
                )}
                {targets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {targetId && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Puede ser sintético si no tiene correo real"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña temporal</Label>
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      <SheetFooter>
        <Button
          type="submit"
          onClick={handleSubmit}
          disabled={isPending || !targetId}
        >
          {isPending ? "Creando…" : "Crear acceso"}
        </Button>
      </SheetFooter>
    </>
  );
}
