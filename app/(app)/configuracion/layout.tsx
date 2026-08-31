import { ConfiguracionNav } from "./configuracion-nav";

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <ConfiguracionNav />
      {children}
    </div>
  );
}
