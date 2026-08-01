import Link from "next/link";
import { Brand } from "../components/brand";
import { Consulta } from "../components/consulta";
import { ThemeToggle } from "../components/theme-toggle";

// Vista principal — modo pull (recorrido de demo §9, pasos 1-3 y 6-7).
// Dueños: Batista + Juanma. El front solo consume /api/intent + /api/match.

export default function Home() {
  return (
    <main className="wrap">
      <header className="masthead">
        <Brand />
        <nav className="nav">
          <Link href="/" aria-current="page">
            Consultar
          </Link>
          <Link href="/panel">Monitoreo</Link>
          <ThemeToggle />
        </nav>
      </header>

      <Consulta />
    </main>
  );
}
