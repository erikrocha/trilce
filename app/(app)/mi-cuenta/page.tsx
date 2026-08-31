import { createClient } from "@/lib/supabase/server";
import { requireAppContext } from "@/lib/auth/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { PasswordForm } from "./password-form";
import { TrustedDevicesList } from "./trusted-devices-list";

export default async function MiCuentaPage() {
  const ctx = await requireAppContext();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", ctx.userId)
    .single();

  const { data: devices } = await supabase
    .from("trusted_devices")
    .select("*")
    .eq("user_id", ctx.userId)
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false });

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div>
        <h1 className="text-lg font-medium">Mi Cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Usuario: <span className="font-mono">{profile?.username ?? "—"}</span>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <ProfileForm profile={profile ?? null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seguridad</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispositivos de confianza</CardTitle>
        </CardHeader>
        <CardContent>
          <TrustedDevicesList devices={devices ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
