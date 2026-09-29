import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { LEVEL_LABELS } from "@/lib/enum-labels";
import { PrintButton } from "@/app/(app)/cuestionarios/tarjetas/print-button";

// Lista imprimible de usuarios y contraseñas temporales de los alumnos, para
// entregársela a cada uno. Solo muestra quienes aún no cambiaron su
// contraseña (initial_credentials se borra al cambiarla).
export default async function CredencialesPage(
  props: PageProps<"/alumnos/credenciales">
) {
  const ctx = await requireAppContext();
  if (ctx.role !== "admin" && ctx.role !== "administrativo") {
    redirect("/alumnos");
  }

  const searchParams = await props.searchParams;
  const groupParam = Array.isArray(searchParams.grupo)
    ? searchParams.grupo[0]
    : searchParams.grupo;

  const supabase = await createClient();
  const { data } = await supabase
    .from("student_initial_credentials")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .neq("status", "inactivo")
    .order("paternal_surname", { ascending: true })
    .order("maternal_surname", { ascending: true })
    .order("first_names", { ascending: true });

  const rows = data ?? [];
  const groupKey = (r: (typeof rows)[number]) =>
    `${r.level ?? ""}|${r.grade ?? ""}|${r.section ?? ""}`;
  const groupLabel = (key: string) => {
    const [level, grade, section] = key.split("|");
    if (!level && !grade && !section) return "Sin sección";
    return `${level ? LEVEL_LABELS[level] : ""} ${grade}° ${section}`.trim();
  };

  const groups = [...new Set(rows.map(groupKey))].sort();
  const selected =
    groupParam && groups.includes(groupParam) ? groupParam : groups[0];
  const visible = rows.filter((r) => groupKey(r) === selected);

  const host = (await headers()).get("host");
  const loginUrl = host ? `${host}/login` : null;

  return (
    <div className="flex flex-col gap-4 print:gap-2 print:bg-white print:p-8 print:text-black">
      <div className="flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-2">
          <Link
            href="/alumnos"
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronLeftIcon />
          </Link>
          <div>
            <h1 className="text-lg font-medium">Credenciales de alumnos</h1>
            <p className="text-sm text-muted-foreground">
              Usuarios y contraseñas temporales. Un alumno sale de esta lista
              cuando cambia su contraseña.
            </p>
          </div>
        </div>
        <PrintButton disabled={visible.length === 0} />
      </div>

      {groups.length > 1 && (
        <div className="flex flex-wrap gap-2 print:hidden">
          {groups.map((key) => (
            <Link
              key={key}
              href={`/alumnos/credenciales?grupo=${encodeURIComponent(key)}`}
              className={cn(
                buttonVariants({
                  variant: key === selected ? "default" : "outline",
                  size: "sm",
                })
              )}
            >
              {groupLabel(key)}
            </Link>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay alumnos con contraseña temporal pendiente de entregar.
        </p>
      ) : (
        <div className="rounded-2xl border border-border print:rounded-none print:border-none">
          <div className="flex items-baseline justify-between border-b border-border p-4 print:border-black print:px-0">
            <div>
              <p className="font-medium">{ctx.schoolName}</p>
              <p className="text-sm text-muted-foreground print:text-black">
                Accesos al sistema — {groupLabel(selected)}
              </p>
            </div>
            <p className="text-sm text-muted-foreground print:text-black">
              {new Date().toLocaleDateString("es-PE")}
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground print:border-black print:text-black">
                <th className="px-4 py-2 font-normal print:px-2">N°</th>
                <th className="px-4 py-2 font-normal print:px-2">Código</th>
                <th className="px-4 py-2 font-normal print:px-2">
                  Apellidos y nombres
                </th>
                <th className="px-4 py-2 font-normal print:px-2">Usuario</th>
                <th className="px-4 py-2 font-normal print:px-2">Correo</th>
                <th className="px-4 py-2 font-normal print:px-2">Contraseña</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <tr
                  key={r.student_id}
                  className="break-inside-avoid border-b border-border print:border-gray-400"
                >
                  <td className="px-4 py-2 print:px-2">{i + 1}</td>
                  <td className="px-4 py-2 font-mono text-xs print:px-2">
                    {r.code}
                  </td>
                  <td className="px-4 py-2 print:px-2">
                    {r.paternal_surname} {r.maternal_surname ?? ""},{" "}
                    {r.first_names}
                  </td>
                  <td className="px-4 py-2 font-mono print:px-2">
                    {r.username}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs print:px-2">
                    {r.email}
                  </td>
                  <td className="px-4 py-2 font-mono print:px-2">
                    {r.temp_password}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-4 text-xs text-muted-foreground print:px-0 print:text-black">
            Ingresa{loginUrl ? ` en ${loginUrl}` : ""} con tu usuario o correo
            y la contraseña temporal. Luego cámbiala en Mi Cuenta (menú de tu avatar).
          </p>
        </div>
      )}
    </div>
  );
}
