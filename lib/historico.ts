import "server-only";
import { prisma } from "./db";
import { janelaDoPeriodo } from "./painel";
import { type FiltroRefeicao, type Periodo, filtroParaRefeicao } from "./tipos";

export const POR_PAGINA = 20;

export type FiltroHistorico = { pagina: number; periodo: Periodo | "todos"; refeicao: FiltroRefeicao };

export async function obterHistorico({ pagina, periodo, refeicao }: FiltroHistorico) {
  const ref = filtroParaRefeicao(refeicao);
  const where: Record<string, unknown> = ref ? { refeicao: ref } : {};
  if (periodo !== "todos") {
    const j = await janelaDoPeriodo(periodo, where);
    if (j) where.criadaEm = { gte: j.inicio, lt: j.fim };
  }
  const total = await prisma.analise.count({ where });
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const p = Math.min(Math.max(1, pagina), paginas);
  const itens = await prisma.analise.findMany({
    where,
    orderBy: { criadaEm: "desc" },
    skip: (p - 1) * POR_PAGINA,
    take: POR_PAGINA,
    select: {
      id: true,
      bandeja: true,
      refeicao: true,
      criadaEm: true,
      fotoFinalUrl: true,
      fotoIdealUrl: true,
      taxaPrato: true,
      gramasDesperdicio: true,
      status: true,
      origem: true,
      mensagemErro: true,
    },
  });
  return { itens, total, pagina: p, paginas, porPagina: POR_PAGINA };
}
