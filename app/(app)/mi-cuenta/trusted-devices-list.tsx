"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Database } from "@/lib/supabase/database.types";
import { revokeTrustedDevice } from "./actions";

type TrustedDevice = Database["public"]["Tables"]["trusted_devices"]["Row"];

export function TrustedDevicesList({ devices }: { devices: TrustedDevice[] }) {
  const [isPending, startTransition] = useTransition();

  if (devices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tienes dispositivos de confianza registrados. La verificación por
        correo (OTP) para nuevos dispositivos todavía no está implementada.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {devices.map((device) => (
        <div
          key={device.id}
          className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm"
        >
          <div>
            <p>{device.device_label ?? "Dispositivo sin nombre"}</p>
            <p className="text-xs text-muted-foreground">
              Visto por última vez:{" "}
              {new Date(device.last_seen_at).toLocaleString("es-PE")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await revokeTrustedDevice(device.id);
              })
            }
          >
            Revocar
          </Button>
        </div>
      ))}
    </div>
  );
}
