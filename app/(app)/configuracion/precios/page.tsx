import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { PriceListForm } from "./price-list-form";

export default async function PreciosPage(
  props: PageProps<"/configuracion/precios">
) {
  const ctx = await requireAppContext();
  const searchParams = await props.searchParams;
  const currentYear = new Date().getFullYear();
  const yearParam = Array.isArray(searchParams.year)
    ? searchParams.year[0]
    : searchParams.year;
  const year = Number(yearParam) || currentYear;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("tuition_schedule")
    .select("*")
    .eq("school_id", ctx.schoolId!)
    .eq("academic_year", year);

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Lista de Precios</h1>
          <p className="text-sm text-muted-foreground">
            Matrícula y pensiones por año lectivo
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/configuracion/precios?year=${year - 1}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronLeftIcon />
          </Link>
          <span className="w-14 text-center font-mono text-sm">{year}</span>
          <Link
            href={`/configuracion/precios?year=${year + 1}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronRightIcon />
          </Link>
        </div>
      </div>
      <PriceListForm key={year} year={year} rows={rows ?? []} canWrite={canWrite} />
    </div>
  );
}
