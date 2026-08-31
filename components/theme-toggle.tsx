"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita el mismatch de hidratación: el tema real solo se conoce en cliente.
  // Patrón oficial de next-themes; no hay forma de expresarlo sin setState en el efecto.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {mounted && resolvedTheme === "dark" ? (
        <SunIcon />
      ) : (
        <MoonIcon />
      )}
    </Button>
  );
}
