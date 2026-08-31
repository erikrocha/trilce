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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/lib/supabase/database.types";
import {
  toggleMembershipActive,
  transferOwnership,
  updateMembershipRole,
} from "./actions";

type MembershipRole = Database["public"]["Enums"]["membership_role"];
type Membership = Database["public"]["Tables"]["memberships"]["Row"];

const STAFF_ROLES: MembershipRole[] = ["admin", "administrativo", "docente"];
const STAFF_ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  administrativo: "Administrativo",
  docente: "Docente",
};

export function EditMembershipSheet({
  membership,
  open,
  onOpenChange,
  isOwner,
  memberName,
}: {
  membership: Membership | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwner: boolean;
  memberName: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {open && membership && (
          <EditMembershipBody
            key={membership.id}
            membership={membership}
            isOwner={isOwner}
            memberName={memberName}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function EditMembershipBody({
  membership,
  isOwner,
  memberName,
}: {
  membership: Membership;
  isOwner: boolean;
  memberName: string;
}) {
  const [role, setRole] = useState(membership.role);
  const [active, setActive] = useState(membership.active);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isStaffRole = STAFF_ROLES.includes(membership.role);

  function handleRoleChange(value: string | null) {
    if (!value) return;
    const newRole = value as MembershipRole;
    setRole(newRole);
    setError(null);
    startTransition(async () => {
      const result = await updateMembershipRole(membership.id, newRole);
      if (result?.error) setError(result.error);
    });
  }

  function handleActiveChange(checked: boolean) {
    setActive(checked);
    setError(null);
    startTransition(async () => {
      const result = await toggleMembershipActive(membership.id, checked);
      if (result?.error) {
        setError(result.error);
        setActive(!checked);
      }
    });
  }

  function handleTransfer() {
    setError(null);
    startTransition(async () => {
      const result = await transferOwnership(membership.id);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{memberName}</SheetTitle>
        <SheetDescription>
          {membership.is_owner ? "Dueño del colegio" : "Miembro del colegio"}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        <div className="flex flex-col gap-1.5">
          <Label>Rol</Label>
          <Select
            value={role}
            onValueChange={handleRoleChange}
            disabled={membership.is_owner || isPending}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {isStaffRole ? (
                Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={membership.role}>
                  {membership.role === "padre" ? "Padre/Apoderado" : "Alumno"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {membership.is_owner && (
            <p className="text-xs text-muted-foreground">
              El dueño es intocable — transfiere la titularidad para cambiarlo.
            </p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <Label htmlFor="active">Activo</Label>
          <Switch
            id="active"
            checked={active}
            onCheckedChange={handleActiveChange}
            disabled={isPending || membership.is_owner}
          />
        </div>

        {isOwner && membership.role === "admin" && !membership.is_owner && (
          <Button
            type="button"
            variant="outline"
            onClick={handleTransfer}
            disabled={isPending || !active}
          >
            Transferir titularidad a esta persona
          </Button>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <SheetFooter />
    </>
  );
}
