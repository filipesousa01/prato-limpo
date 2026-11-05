import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Token simples para o app que tira as fotos.
 * Aceita "Authorization: Bearer <INGEST_TOKEN>" ou "x-ingest-token: <INGEST_TOKEN>".
 */
export function tokenValido(req: Request): boolean {
  const esperado = process.env.INGEST_TOKEN;
  if (!esperado) return false;
  const auth = req.headers.get("authorization") ?? "";
  const recebido = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : (req.headers.get("x-ingest-token") ?? "").trim();
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}
