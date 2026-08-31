"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/lib/supabase/database.types";

type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

export function AuditTab({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="rounded-2xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Entidad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                Sin actividad registrada todavía.
              </TableCell>
            </TableRow>
          )}
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString("es-PE")}
              </TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell className="font-mono text-xs">
                {log.entity_type}
                {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
