/**
 * Resultado de uma análise em formato serializável (servidor → cliente).
 * Usado na página /analise/[id] e no resultado exibido direto na seção de análise.
 */
import type { AnaliseCompleta } from "./analises";
import { type Classe, isClasse, rotulo } from "./classes";
import { fmtG } from "./format";
import { ROTULO_REFEICAO, type Refeicao } from "./tipos";

export type CaixaResultado = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confianca: number;
  rotulo?: string;
  titulo: string;
};

export type DadosResultado = {
  id: string;
  bandeja: string;
  refeicao: string;
  criadaEm: string;
  origem: string;
  status: string;
  mensagemErro: string | null;
  modelo: string | null;
  taxaPrato: number;
  sobraG: number;
  servidoG: number;
  fotos: { idealUrl: string; finalUrl: string; proporcao: number } | null;
  caixas: CaixaResultado[];
  porClasse: { classe: string; rotulo: string; gramas: number; taxa: number; confianca: number | null }[];
  soNoFinal: string[];
};

export function montarResultado(a: AnaliseCompleta, porcoes: Record<Classe, number>): DadosResultado {
  const finais = a.deteccoes.filter((d) => d.foto === "FINAL");
  const gramasPorClasse = new Map(a.resultados.map((r) => [r.classe, r.gramas]));

  // rótulo com gramas e confiança só na maior caixa de cada classe
  const maior = new Map<string, (typeof finais)[number]>();
  for (const d of finais) {
    const atual = maior.get(d.classe);
    if (!atual || d.w * d.h > atual.w * atual.h) maior.set(d.classe, d);
  }
  // confiança média (ponderada pela área) da classe no prato final
  const confClasse = new Map<string, number>();
  for (const c of new Set(finais.map((d) => d.classe))) {
    const ds = finais.filter((d) => d.classe === c);
    const area = ds.reduce((s, d) => s + d.w * d.h, 0);
    confClasse.set(c, area > 0 ? ds.reduce((s, d) => s + d.w * d.h * d.confianca, 0) / area : 0);
  }

  const caixas: CaixaResultado[] = finais.map((d) => {
    const nome = rotulo(d.classe);
    const g = gramasPorClasse.get(d.classe);
    const pct = Math.round(d.confianca * 100);
    return {
      id: d.id,
      x: d.x,
      y: d.y,
      w: d.w,
      h: d.h,
      confianca: d.confianca,
      rotulo: maior.get(d.classe)?.id === d.id ? (g != null ? `${nome} ${fmtG(g)}, ${pct}%` : `${nome} ${pct}%`) : undefined,
      titulo: `${nome}, confiança ${pct}%${d.confianca < 0.6 ? " (provavelmente resto ou osso, conta pouco)" : ""}`,
    };
  });

  const servidoG = a.resultados.reduce((s, r) => s + (isClasse(r.classe) ? porcoes[r.classe] : 0), 0);

  return {
    id: a.id,
    bandeja: a.bandeja,
    refeicao: ROTULO_REFEICAO[a.refeicao as Refeicao] ?? a.refeicao,
    criadaEm: a.criadaEm.toISOString(),
    origem: a.origem,
    status: a.status,
    mensagemErro: a.mensagemErro,
    modelo: a.modelo,
    taxaPrato: a.taxaPrato ?? 0,
    sobraG: a.gramasDesperdicio ?? 0,
    servidoG,
    fotos:
      a.fotoIdealUrl && a.fotoFinalUrl
        ? {
            idealUrl: a.fotoIdealUrl,
            finalUrl: a.fotoFinalUrl,
            proporcao: a.finalW && a.finalH ? a.finalW / a.finalH : 4 / 3,
          }
        : null,
    caixas,
    porClasse: a.resultados.map((r) => ({
      classe: r.classe,
      rotulo: rotulo(r.classe),
      gramas: r.gramas,
      taxa: r.taxa,
      confianca: confClasse.get(r.classe) ?? null,
    })),
    soNoFinal: [...new Set(finais.map((d) => d.classe))].filter((c) => !gramasPorClasse.has(c)).map(rotulo),
  };
}
