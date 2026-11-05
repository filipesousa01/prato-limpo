"use server";

import { criarAnalise, porcoesPadrao } from "@/lib/analises";
import { ErroValidacao } from "@/lib/imagem";
import { type DadosResultado, montarResultado } from "@/lib/resultado";
import { ErroModelo } from "@/lib/roboflow";
import { lerRefeicao } from "@/lib/tipos";

export type RespostaAnalise =
  | { ok: true; resultado: DadosResultado }
  | { ok: false; erro: string; tipo: "validacao" | "modelo" | "interno"; analiseId?: string };

/**
 * Usada pela seção de análise da página inicial. O app das fotos usa POST /api/analises
 * com INGEST_TOKEN; as duas entradas chamam o mesmo serviço (lib/analises.ts).
 */
export async function analisarAction(fd: FormData): Promise<RespostaAnalise> {
  const refeicao = lerRefeicao(fd.get("refeicao")) ?? "ALMOCO";
  try {
    const a = await criarAnalise({
      ideal: fd.get("ideal"),
      final: fd.get("final"),
      bandeja: String(fd.get("bandeja") ?? ""),
      refeicao,
      exemplo: fd.get("exemplo") === "1",
    });
    if (!a) return { ok: false, erro: "A análise não foi salva.", tipo: "interno" };
    return { ok: true, resultado: montarResultado(a, await porcoesPadrao()) };
  } catch (e) {
    if (e instanceof ErroValidacao) return { ok: false, erro: e.message, tipo: "validacao", analiseId: e.analiseId };
    if (e instanceof ErroModelo) return { ok: false, erro: e.message, tipo: "modelo", analiseId: e.analiseId };
    console.error("[analisarAction]", e);
    return { ok: false, erro: "Erro interno ao processar a análise.", tipo: "interno" };
  }
}
