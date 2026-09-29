"use client";

import { PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton({ disabled }: { disabled?: boolean }) {
  return (
    <Button size="sm" disabled={disabled} onClick={() => window.print()}>
      <PrinterIcon />
      Imprimir
    </Button>
  );
}
