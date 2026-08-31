"use client";

import { useState, useTransition } from "react";
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
import { PLATFORM_STAFF_ROLE_LABELS } from "@/lib/enum-labels";
import type { Database } from "@/lib/supabase/database.types";
import { createPlatformStaffMember, togglePlatformStaffActive } from "./actions";

type PlatformStaffRole = Database["public"]["Enums"]["platform_staff_role"];
type PlatformStaffMember = Database["public"]["Tables"]["platform_staff"]["Row"] & {
  profile: { username: string | null; contact_email: string | null; full_name: string | null } | null;
};

export function TeamTab({
  staff,
  isSuperadmin,
}: {
  staff: PlatformStaffMember[];
  isSuperadmin: boolean;
}) {
  const [creating, setCreating] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          {isSuperadmin && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <PlusIcon />
              Nuevo miembro
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell>{member.profile?.full_name ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs">
                  {member.profile?.username ?? "—"}
                </TableCell>
                <TableCell>{PLATFORM_STAFF_ROLE_LABELS[member.role]}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Badge variant={member.active ? "default" : "secondary"}>
                    {member.active ? "Activo" : "Inactivo"}
                  </Badge>
                  {isSuperadmin && (
                    <Switch
                      checked={member.active}
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        startTransition(async () => {
                          await togglePlatformStaffActive(member.id, checked);
                        })
                      }
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {creating && <NewTeamMemberForm onDone={() => setCreating(false)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function NewTeamMemberForm({ onDone }: { onDone: () => void }) {
  const [role, setRole] = useState<PlatformStaffRole>("support");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPlatformStaffMember({
        role,
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

  return (
    <>
      <SheetHeader>
        <SheetTitle>Nuevo miembro del equipo</SheetTitle>
        <SheetDescription>Acceso al Dashboard de Plataforma.</SheetDescription>
      </SheetHeader>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full_name">Nombre completo</Label>
          <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Rol</Label>
          <Select value={role} onValueChange={(v) => setRole((v as PlatformStaffRole) ?? "support")}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PLATFORM_STAFF_ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Correo</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Usuario</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Contraseña temporal</Label>
          <Input id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
      <SheetFooter>
        <Button type="submit" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Creando…" : "Crear acceso"}
        </Button>
      </SheetFooter>
    </>
  );
}
