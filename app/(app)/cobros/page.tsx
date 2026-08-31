import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { InvoiceList } from "./invoice-list";

export default async function CobrosPage(props: PageProps<"/cobros">) {
  const ctx = await requireAppContext();
  const searchParams = await props.searchParams;
  const currentYear = new Date().getFullYear();
  const yearParam = Array.isArray(searchParams.year)
    ? searchParams.year[0]
    : searchParams.year;
  const year = Number(yearParam) || currentYear;

  const supabase = await createClient();
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "*, students(code, paternal_surname, maternal_surname, first_names)"
    )
    .eq("school_id", ctx.schoolId!)
    .eq("academic_year", year)
    .order("due_date", { ascending: true });

  const canWrite = ctx.role === "admin" || ctx.role === "administrativo";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Cobros Pendientes</h1>
          <p className="text-sm text-muted-foreground">
            Estado de boletas por alumno
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/cobros?year=${year - 1}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronLeftIcon />
          </Link>
          <span className="w-14 text-center font-mono text-sm">{year}</span>
          <Link
            href={`/cobros?year=${year + 1}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <ChevronRightIcon />
          </Link>
        </div>
      </div>
      <InvoiceList invoices={invoices ?? []} canWrite={canWrite} />
    </div>
  );
}
