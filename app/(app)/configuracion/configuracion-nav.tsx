"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/configuracion/precios", label: "Lista de Precios" },
  { href: "/configuracion/talonario", label: "Talonario" },
  { href: "/configuracion/pagos", label: "Orígenes de Pago" },
];

export function ConfiguracionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
