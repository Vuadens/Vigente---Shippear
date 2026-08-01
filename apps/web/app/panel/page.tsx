import Link from "next/link";
import { getPerfiles } from "@vigente/db";
import { Brand } from "../../components/brand";
import { Panel } from "../../components/panel";
import { ThemeToggle } from "../../components/theme-toggle";
import type { PerfilGuardadoVista } from "../../lib/tipos";

// Vista push (recorrido de demo §9, pasos 3-5 y 8). Dueños: Batista + Juanma.
// Server Component: carga los perfiles guardados desde la única superficie de BD.

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const perfiles = (await getPerfiles()) as PerfilGuardadoVista[];

  return (
    <main className="wrap">
      <header className="masthead">
        <Brand />
        <nav className="nav">
          <Link href="/">Consultar</Link>
          <Link href="/panel" aria-current="page">
            Monitoreo
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <Panel inicial={perfiles} />
    </main>
  );
}
