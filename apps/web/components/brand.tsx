import Link from "next/link";

// Marca de Vigente: el logotipo (V blanca sobre azul) + el wordmark.
// Reutilizado por el masthead de Consultar y Monitoreo (evita duplicación).
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Vigente — inicio">
      <img
        src="/logo-vigente.png"
        alt=""
        width={36}
        height={36}
        className="brand-logo"
      />
      <span className="brand-word">
        Vigente<span className="dot">.</span>
      </span>
    </Link>
  );
}
