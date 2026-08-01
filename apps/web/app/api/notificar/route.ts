import { match } from "@vigente/matcher";
import { PerfilSchema, type Norma } from "@vigente/schema";
import normasReales from "../../../../../data/normas.json";

// Entrega de Alertas por Telegram (ADR-0009). Segunda superficie runtime no-LLM.
// El token nunca toca el cliente. El mensaje se arma GROUNDED: corre el mismo
// match() determinístico contra data/normas.json y usa la obligación real de la
// norma-novedad. Nada de texto inventado (regla #1 anti-alucinación).
//
// Entrega best-effort: si Telegram falla, esta ruta responde ok:false pero el
// banner en pantalla no depende de esto (lo maneja el cliente). Mismo criterio
// de fallback que @vigente/db e /api/intent.

const normas = normasReales as Norma[];

function armarMensaje(
  nombre: string,
  norma: { tipo: string; numero: string; url_fuente: string; resumen_llano: string },
  obligacion: { que_hacer: string; si_no_cumplis: string },
): string {
  // HTML de Telegram (parse_mode HTML). Sin cuenta regresiva: el plazo es
  // permanente, se apoya en "qué hacer" + "si no cumplís" + fuente oficial.
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return [
    `🔔 <b>Nueva normativa que te afecta</b>`,
    ``,
    `<b>${esc(nombre)}</b>`,
    `${esc(norma.tipo)} ${esc(norma.numero)} — ${esc(norma.resumen_llano)}`,
    ``,
    `📋 <b>Qué tenés que hacer</b>`,
    esc(obligacion.que_hacer),
    ``,
    `⚠️ <b>Si no cumplís</b>`,
    esc(obligacion.si_no_cumplis),
    ``,
    `🔗 <a href="${norma.url_fuente}">Fuente oficial</a>`,
  ].join("\n");
}

export async function POST(req: Request) {
  const body = await req.json();
  const nombre = typeof body?.nombre === "string" ? body.nombre.trim() : "Tu perfil";
  const normaId = typeof body?.normaId === "string" ? body.normaId : "";
  const parse = PerfilSchema.safeParse(body?.perfil);
  if (!parse.success || !normaId) {
    return Response.json({ ok: false, error: "datos inválidos" }, { status: 400 });
  }

  // Grounding: recomputo el match y tomo la obligación real de la norma-novedad.
  const matcheadas = match(parse.data, normas);
  const item = matcheadas.find((m) => m.norma.id === normaId);
  if (!item) {
    return Response.json({ ok: false, error: "la norma-novedad no matchea este perfil" }, { status: 404 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // Sin credenciales la entrega no sale; la demo en pantalla funciona igual.
    return Response.json({ ok: false, error: "telegram no configurado" });
  }

  const texto = armarMensaje(nombre, item.norma, item.obligacion);

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: "HTML",
        disable_web_page_preview: false,
      }),
    });
    const data = await r.json();
    return Response.json({ ok: data.ok === true, telegram: data });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) });
  }
}
