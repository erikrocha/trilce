"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/lib/supabase/database.types";
import { NewMemberSheet } from "./new-member-sheet";
import { EditMembershipSheet } from "./edit-membership-sheet";

type MembershipRole = Database["public"]["Enums"]["membership_role"];
type Membership = Database["public"]["Tables"]["memberships"]["Row"] & {
  students: {
    code: string;
    paternal_surname: string;
    maternal_surname: string | null;
    first_names: string;
  } | null;
  guardians: {
    paternal_surname: string | null;
    maternal_surname: string | null;
    first_names: string;
  } | null;
  staff_members: { full_name: string; staff_type: string } | null;
  profile: { id: string; username: string | null; contact_email: string | null } | null;
};

export type Candidate = { id: string; label: string; email: string | null };

const ROLE_LABELS: Record<MembershipRole, string> = {
  admin: "Admin",
  administrativo: "Administrativo",
  docente: "Docente",
  padre: "Padre/Apoderado",
  alumno: "Alumno",
};

function memberName(m: Membership) {
  if (m.staff_members) return m.staff_members.full_name;
  if (m.guardians)
    return `${m.guardians.paternal_surname ?? ""} ${m.guardians.maternal_surname ?? ""}, ${m.guardians.first_names}`;
  if (m.students)
    return `${m.students.paternal_surname} ${m.students.maternal_surname ?? ""}, ${m.students.first_names}`;
  return "—";
}

export function MemberList({
  memberships,
  availableStaff,
  availableGuardians,
  availableStudents,
  isOwner,
  currentUserId,
}: {
  memberships: Membership[];
  availableStaff: { id: string; full_name: string; email: string | null }[];
  availableGuardians: {
    id: string;
    paternal_surname: string | null;
    maternal_surname: string | null;
    first_names: string;
    email: string | null;
  }[];
  availableStudents: {
    id: string;
    code: string;
    paternal_surname: string;
    maternal_surname: string | null;
    first_names: string;
    institutional_email: string | null;
  }[];
  isOwner: boolean;
  currentUserId: string;
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Membership | null>(null);

  return (
    <>
      <div className="rounded-2xl border border-border">
        <div className="flex items-center justify-end border-b border-border p-3">
          <Button size="sm" onClick={() => setCreating(true)}>
            <PlusIcon />
            Nuevo miembro
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberships.map((m) => (
              <TableRow
                key={m.id}
                className="cursor-pointer"
                onClick={() => setEditing(m)}
              >
                <TableCell>
                  {memberName(m)}
                  {m.user_id === currentUserId && (
                    <span className="text-muted-foreground"> (tú)</span>
                  )}
                </TableCell>
                <TableCell>
                  {ROLE_LABELS[m.role]}
                  {m.is_owner && (
                    <Badge className="ml-1.5" variant="outline">
                      Dueño
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {m.profile?.username ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={m.active ? "default" : "secondary"}>
                    {m.active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <NewMemberSheet
        open={creating}
        onOpenChange={setCreating}
        availableStaff={availableStaff}
        availableGuardians={availableGuardians}
        availableStudents={availableStudents}
      />

      <EditMembershipSheet
        membership={editing}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        isOwner={isOwner}
        memberName={editing ? memberName(editing) : ""}
      />
    </>
  );
}
