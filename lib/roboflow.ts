import "server-only";
import type { PredicaoBruta } from "./desperdicio";

/**
 * Inferência no endpoint serverless da Roboflow.
 * A chave fica só no servidor (ROBOFLOW_API_KEY); o navegador nunca chama a Roboflow.
 *
 * Formato: POST {API}/{modelo}/{versão}, corpo = imagem em base64
 * (application/x-www-form-urlencoded). Autenticação preferida: Authorization: Bearer;
 * se o endpoint recusar (401/403), repete no formato legado ?api_key=.
 */

export function configRoboflow() {
  const conf = Number(process.env.ROBOFLOW_CONFIDENCE ?? "0.4");
  return {
    apiUrl: (process.env.ROBOFLOW_API_URL || "https://serverless.roboflow.com").replace(/\/$/, ""),
    modelo: process.env.ROBOFLOW_MODEL_ID || "desperdicio_ru-fwub5",
    versao: process.env.ROBOFLOW_MODEL_VERSION || "35",
    confianca: Number.isFinite(conf) && conf > 0 && conf < 1 ? conf : 0.4,
    chave: process.env.ROBOFLOW_API_KEY || "",
  };
}

export class ErroModelo extends Error {
  status = 502;
  /** id da análise salva com status ERRO, quando houver */
  analiseId?: string;
}

type RespostaRoboflow = {
  predictions?: PredicaoBruta[];
  image?: { width?: number | string; height?: number | string };
};

let modoAuth: "bearer" | "legado" = "bearer";

export async function inferir(bytes: Buffer): Promise<{ predicoes: PredicaoBruta[]; w?: number; h?: number }> {
  const cfg = configRoboflow();
  if (!cfg.chave) {
    throw new ErroModelo("O modelo não está configurado: defina ROBOFLOW_API_KEY no servidor.");
  }
  const corpo = bytes.toString("base64");
  const base = `${cfg.apiUrl}/${encodeURIComponent(cfg.modelo)}/${encodeURIComponent(cfg.versao)}`;

  const chamar = (modo: "bearer" | "legado") => {
    const q = new URLSearchParams({ confidence: String(cfg.confianca), format: "json" });
    if (modo === "legado") q.set("api_key", cfg.chave);
    return fetch(`${base}?${q}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(modo === "bearer" ? { Authorization: `Bearer ${cfg.chave}` } : {}),
      },
      body: corpo,
      signal: AbortSignal.timeout(45_000),
      cache: "no-store",
    });
  };

  let res: Response;
  try {
    res = await chamar(modoAuth);
    if ((res.status === 401 || res.status === 403) && modoAuth === "bearer") {
      res = await chamar("legado");
      if (res.ok) modoAuth = "legado";
    }
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new ErroModelo(timeout ? "O modelo demorou demais para responder. Tente de novo." : "Não foi possível falar com o modelo.");
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error(`[roboflow] HTTP ${res.status}: ${txt.slice(0, 300)}`);
    if (res.status === 401 || res.status === 403) throw new ErroModelo("A chave da Roboflow foi recusada.");
    if (res.status === 413) throw new ErroModelo("A foto é grande demais para o modelo.");
    throw new ErroModelo(`O modelo respondeu com erro (HTTP ${res.status}).`);
  }

  const json = (await res.json()) as RespostaRoboflow;
  const w = Number(json.image?.width);
  const h = Number(json.image?.height);
  return {
    predicoes: Array.isArray(json.predictions) ? json.predictions : [],
    w: w > 0 ? w : undefined,
    h: h > 0 ? h : undefined,
  };
}
