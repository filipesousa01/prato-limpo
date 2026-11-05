import { CLASSES, ROTULOS } from "@/lib/classes";
import { DIAS_UTEIS } from "@/lib/datas";
import { fmtNum } from "@/lib/format";
import { obterPainel } from "@/lib/painel";
import { ROTULO_FILTRO_REFEICAO, ROTULO_PERIODO, lerFiltroRefeicao, lerPeriodo } from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** CSV dos agregados do painel (separador ";" e vírgula decimal, para abrir direto no Excel em pt-BR). */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const periodo = lerPeriodo(sp.get("periodo"));
  const refeicao = lerFiltroRefeicao(sp.get("refeicao"));
  const d = await obterPainel(periodo, refeicao);

  const pct = (v: number | null) => (v == null ? "" : fmtNum(v * 100, 1));
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const linhas: string[][] = [];

  linhas.push(["Prato Limpo · Relatório de desperdício"]);
  linhas.push(["Período", `${ROTULO_PERIODO[periodo]} · ${d.rotuloPeriodo}`]);
  linhas.push(["Refeição", ROTULO_FILTRO_REFEICAO[refeicao]]);
  if (d.exemplo) linhas.push(["Observação", "Contém dados de exemplo"]);
  linhas.push([]);
  linhas.push(["Indicador", "Valor"]);
  linhas.push(["Pratos analisados", String(d.kpis.pratos)]);
  linhas.push(["Taxa média de desperdício (%)", pct(d.kpis.taxaMedia)]);
  linhas.push(["Meta (%)", pct(d.meta)]);
  linhas.push(["Comida desperdiçada estimada (kg)", fmtNum(d.kpis.gramas / 1000, 1)]);
  linhas.push(["Equivalente em refeições de 450 g", String(Math.round(d.kpis.gramas / 450))]);
  linhas.push([]);
  linhas.push(["Classe", "Taxa (%)", "Pratos", "Desperdício (kg)", "Participação (%)"]);
  for (const l of [...d.porClasse].sort((a, b) => (b.taxa ?? -1) - (a.taxa ?? -1))) {
    linhas.push([l.rotulo, pct(l.taxa), String(l.pratos), fmtNum(l.gramas / 1000, 2), pct(l.participacao)]);
  }
  linhas.push([]);
  linhas.push(["Taxa por dia da semana (%)", ...DIAS_UTEIS]);
  for (const h of d.heatmap) linhas.push([h.rotulo, ...h.valores.map(pct)]);
  linhas.push([]);
  linhas.push(["Evolução semanal (%)", ...d.tendencia.rotulos]);
  linhas.push(["Todas as classes", ...d.tendencia.geral.map(pct)]);
  for (const c of CLASSES) linhas.push([ROTULOS[c], ...d.tendencia.porClasse[c].map(pct)]);

  const csv = "﻿" + linhas.map((l) => l.map(esc).join(";")).join("\r\n");
  const nome = `prato-limpo_${periodo}_${refeicao}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nome}"`,
      "Cache-Control": "no-store",
    },
  });
}
