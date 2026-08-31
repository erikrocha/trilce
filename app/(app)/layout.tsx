import { AppShell } from "@/components/app-shell";
import { requireAppContext } from "@/lib/auth/context";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAppContext();

  return (
    <AppShell
      schoolName={ctx.schoolName}
      email={ctx.email}
      displayName={ctx.displayName}
      role={ctx.role}
      isPlatformStaff={ctx.isPlatformStaff}
    >
      {children}
    </AppShell>
  );
}
