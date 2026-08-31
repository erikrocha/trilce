"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Database } from "@/lib/supabase/database.types";
import { SchoolsTab } from "./schools-tab";
import { PlansTab } from "./plans-tab";
import { TeamTab } from "./team-tab";
import { AuditTab } from "./audit-tab";

type Plan = Database["public"]["Tables"]["plans"]["Row"];
type School = Database["public"]["Tables"]["schools"]["Row"] & {
  subscriptions: {
    id: string;
    status: string;
    plan_id: string;
    current_period_end: string | null;
    plans: { name: string } | null;
  }[];
};
type PlatformStaffMember = Database["public"]["Tables"]["platform_staff"]["Row"] & {
  profile: { username: string | null; contact_email: string | null; full_name: string | null } | null;
};
type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

export function PlatformDashboard({
  isSuperadmin,
  schools,
  plans,
  platformStaff,
  auditLogs,
}: {
  isSuperadmin: boolean;
  schools: School[];
  plans: Plan[];
  platformStaff: PlatformStaffMember[];
  auditLogs: AuditLog[];
}) {
  const [tab, setTab] = useState("colegios");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Dashboard de Plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Colegios, planes, equipo y auditoría del SaaS
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v ?? "colegios")}>
        <TabsList variant="line">
          <TabsTrigger value="colegios">Colegios</TabsTrigger>
          <TabsTrigger value="planes">Planes</TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
        </TabsList>

        <TabsContent value="colegios" className="pt-4">
          <SchoolsTab schools={schools} plans={plans} />
        </TabsContent>
        <TabsContent value="planes" className="pt-4">
          <PlansTab plans={plans} />
        </TabsContent>
        <TabsContent value="equipo" className="pt-4">
          <TeamTab staff={platformStaff} isSuperadmin={isSuperadmin} />
        </TabsContent>
        <TabsContent value="auditoria" className="pt-4">
          <AuditTab logs={auditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
