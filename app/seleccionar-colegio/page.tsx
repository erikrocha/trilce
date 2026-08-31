import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { selectSchool } from "./actions";

export default async function SeleccionarColegioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("school_id, role, schools(id, name)")
    .eq("user_id", user.id)
    .eq("active", true);

  if (!memberships || memberships.length === 0) {
    redirect("/login");
  }

  if (memberships.length === 1) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Elige un colegio</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {memberships.map((m) => (
            <form
              key={m.school_id}
              action={selectSchool.bind(null, m.school_id)}
            >
              <Button
                type="submit"
                variant="outline"
                className="w-full justify-start"
              >
                {m.schools?.name ?? "Colegio"}
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
