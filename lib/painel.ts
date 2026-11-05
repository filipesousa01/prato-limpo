import "server-only";
import { CLASSES, type Classe, ROTULOS, isClasse } from "./classes";
import { addDias, addMeses, indiceDiaUtil, inicioDaSemana, inicioDoDia, inicioDoMes, semanasEntre } from "./datas";
import { prisma } from "./db";
import { fmtIntervalo } from "./format";
import { type FiltroRefeicao, type Periodo, filtroParaRefeicao } from "./tipos";

export type LinhaClasse = {
  classe: Classe;
  rotulo: string;
  /** taxa média (0..1) dos pratos que tinham a classe; null sem pratos */
  taxa: number | null;
  pratos: number;
  gramas: number;
  /** fração do total desperdiçado em massa */
  participacao: number;
};

export type DadosPainel = {
  periodo: Periodo;
  refeicao: FiltroRefeicao;
  vazio: boolean;
  exemplo: boolean;
  rotuloPeriodo: string;
  semanaSemestre: number | null;
  meta: number;
  kpis: {
    pratos: number;
    pratosAnt: number | null;
    taxaMedia: number | null;
    taxaMediaAnt: number | null;
    gramas: number;
    classeTop: { classe: Classe; rotulo: string; taxa: number } | null;
    rotuloComparacao: string;
  };
  porClasse: LinhaClasse[];
  heatmap: { classe: Classe; rotulo: string; valores: (number | null)[] }[];
  tendencia: {
    rotulos: string[];
    geral: (number | null)[];
    porClasse: Record<Classe, (number | null)[]>;
  };
  frase: string | null;
};

const ARTIGO: Record<Classe, "a" | "o"> = {
  abobora: "a",
  arroz: "o",
  batata: "a",
  carne_bovina: "a",
  carne_suina: "a",
  farofa: "a",
  feijao: "o",
  frango_derivados: "o",
  fruta: "a",
  macarrao: "o",
  peixe: "o",
  salada: "a",
};

const ROTULO_COMPARACAO: Record<Periodo, string> = {
  dia: "vs. dia anterior",
  semana: "vs. semana anterior",
  mes: "vs. mês anterior",
  semestre: "",
};

export async function obterMeta() {
  const m = await prisma.meta.findUnique({ where: { id: 1 } });
  return { taxaMeta: m?.taxaMeta ?? 0.15, inicioSemestre: m?.inicioSemestre ?? null };
}

type Janela = { inicio: Date; fim: Date };

async function janelas(periodo: Periodo, ref: Date, inicioSemestre: Date | null, base: object) {
  let atual: Janela;
  let anterior: Janela | null;
  switch (periodo) {
    case "dia": {
      const ini = inicioDoDia(ref);
      atual = { inicio: ini, fim: addDias(ini, 1) };
      const antes = await prisma.analise.findFirst({
        where: { ...base, criadaEm: { lt: ini } },
        orderBy: { criadaEm: "desc" },
        select: { criadaEm: true },
      });
      anterior = antes ? { inicio: inicioDoDia(antes.criadaEm), fim: addDias(inicioDoDia(antes.criadaEm), 1) } : null;
      break;
    }
    case "semana": {
      const ini = inicioDaSemana(ref);
      atual = { inicio: ini, fim: addDias(ini, 7) };
      anterior = { inicio: addDias(ini, -7), fim: ini };
      break;
    }
    case "mes": {
      const ini = inicioDoMes(ref);
      atual = { inicio: ini, fim: addMeses(ini, 1) };
      anterior = { inicio: addMeses(ini, -1), fim: ini };
      break;
    }
    case "semestre": {
      let ini = inicioSemestre;
      if (!ini) {
        const pri = await prisma.analise.findFirst({ where: base, orderBy: { criadaEm: "asc" }, select: { criadaEm: true } });
        ini = inicioDaSemana(pri?.criadaEm ?? ref);
      }
      atual = { inicio: ini, fim: addDias(inicioDaSemana(ref), 7) };
      anterior = null;
      break;
    }
  }
  return { atual, anterior };
}

const media = (s: { soma: number; n: number }) => (s.n > 0 ? s.soma / s.n : null);

/** Janela do período em relação à análise mais recente (usada também no histórico). */
export async function janelaDoPeriodo(periodo: Periodo, where: object): Promise<Janela | null> {
  const ultima = await prisma.analise.findFirst({ where, orderBy: { criadaEm: "desc" }, select: { criadaEm: true } });
  if (!ultima) return null;
  const { inicioSemestre } = await obterMeta();
  return (await janelas(periodo, ultima.criadaEm, inicioSemestre, where)).atual;
}

export async function obterPainel(periodo: Periodo, refeicao: FiltroRefeicao): Promise<DadosPainel> {
  const { taxaMeta, inicioSemestre } = await obterMeta();
  const ref_ = filtroParaRefeicao(refeicao);
  const base = {
    status: "CONCLUIDA",
    origem: { in: ["REAL", "EXEMPLO"] },
    ...(ref_ ? { refeicao: ref_ } : {}),
  };

  const vazioPorClasse = Object.fromEntries(CLASSES.map((c) => [c, [] as (number | null)[]])) as Record<
    Classe,
    (number | null)[]
  >;
  const vazio: DadosPainel = {
    periodo,
    refeicao,
    vazio: true,
    exemplo: false,
    rotuloPeriodo: "Sem análises registradas",
    semanaSemestre: null,
    meta: taxaMeta,
    kpis: {
      pratos: 0,
      pratosAnt: null,
      taxaMedia: null,
      taxaMediaAnt: null,
      gramas: 0,
      classeTop: null,
      rotuloComparacao: ROTULO_COMPARACAO[periodo],
    },
    porClasse: [],
    heatmap: [],
    tendencia: { rotulos: [], geral: [], porClasse: vazioPorClasse },
    frase: null,
  };

  const ultima = await prisma.analise.findFirst({ where: base, orderBy: { criadaEm: "desc" }, select: { criadaEm: true } });
  if (!ultima) return vazio;
  const ref = ultima.criadaEm;

  const { atual, anterior } = await janelas(periodo, ref, inicioSemestre, base);
  const semanaRef = inicioDaSemana(ref);
  const inicioTendencia = addDias(semanaRef, -63);
  const fimTendencia = addDias(semanaRef, 7);

  const inicioBusca = new Date(
    Math.min(atual.inicio.getTime(), anterior?.inicio.getTime() ?? Infinity, inicioTendencia.getTime()),
  );
  const fimBusca = new Date(Math.max(atual.fim.getTime(), fimTendencia.getTime()));
  const intervalo = { gte: inicioBusca, lt: fimBusca };

  const [analises, resultados] = await Promise.all([
    prisma.analise.findMany({
      where: { ...base, criadaEm: intervalo },
      select: { id: true, criadaEm: true, taxaPrato: true, gramasDesperdicio: true, origem: true },
    }),
    prisma.resultadoClasse.findMany({
      where: { analise: { ...base, criadaEm: intervalo } },
      select: { analiseId: true, classe: true, taxa: true, gramas: true },
    }),
  ]);

  const dentro = (t: number, j: Janela | null) => !!j && t >= j.inicio.getTime() && t < j.fim.getTime();
  const quando = new Map<string, number>();

  // ---------- KPIs ----------
  let pratos = 0;
  let pratosAnt = 0;
  const taxa = { soma: 0, n: 0 };
  const taxaAnt = { soma: 0, n: 0 };
  let gramas = 0;
  let exemplo = false;
  let ultimaNoPeriodo = atual.inicio.getTime();
  const semanas = Array.from({ length: 10 }, () => ({ soma: 0, n: 0 }));

  for (const a of analises) {
    const t = a.criadaEm.getTime();
    quando.set(a.id, t);
    if (dentro(t, atual)) {
      pratos++;
      if (a.taxaPrato != null) {
        taxa.soma += a.taxaPrato;
        taxa.n++;
      }
      gramas += a.gramasDesperdicio ?? 0;
      if (a.origem === "EXEMPLO") exemplo = true;
      if (t > ultimaNoPeriodo) ultimaNoPeriodo = t;
    } else if (dentro(t, anterior)) {
      pratosAnt++;
      if (a.taxaPrato != null) {
        taxaAnt.soma += a.taxaPrato;
        taxaAnt.n++;
      }
    }
    if (t >= inicioTendencia.getTime() && t < fimTendencia.getTime() && a.taxaPrato != null) {
      const w = Math.floor((t - inicioTendencia.getTime()) / (7 * 864e5));
      if (w >= 0 && w < 10) {
        semanas[w].soma += a.taxaPrato;
        semanas[w].n++;
      }
    }
  }

  // ---------- por classe, heatmap e tendência por classe ----------
  const porClasse = new Map<Classe, { soma: number; n: number; gramas: number }>();
  const heat = new Map<Classe, { soma: number; n: number }[]>();
  const tend = new Map<Classe, { soma: number; n: number }[]>();
  for (const c of CLASSES) {
    porClasse.set(c, { soma: 0, n: 0, gramas: 0 });
    heat.set(c, Array.from({ length: 5 }, () => ({ soma: 0, n: 0 })));
    tend.set(c, Array.from({ length: 10 }, () => ({ soma: 0, n: 0 })));
  }

  for (const r of resultados) {
    if (!isClasse(r.classe)) continue;
    const t = quando.get(r.analiseId);
    if (t === undefined) continue;
    if (dentro(t, atual)) {
      const pc = porClasse.get(r.classe)!;
      pc.soma += r.taxa;
      pc.n++;
      pc.gramas += r.gramas;
      const d = indiceDiaUtil(new Date(t));
      if (d !== null) {
        const h = heat.get(r.classe)![d];
        h.soma += r.taxa;
        h.n++;
      }
    }
    if (t >= inicioTendencia.getTime() && t < fimTendencia.getTime()) {
      const w = Math.floor((t - inicioTendencia.getTime()) / (7 * 864e5));
      if (w >= 0 && w < 10) {
        const s = tend.get(r.classe)![w];
        s.soma += r.taxa;
        s.n++;
      }
    }
  }

  const totalG = [...porClasse.values()].reduce((s, v) => s + v.gramas, 0);
  const linhas: LinhaClasse[] = CLASSES.map((c) => {
    const v = porClasse.get(c)!;
    return {
      classe: c,
      rotulo: ROTULOS[c],
      taxa: media(v),
      pratos: v.n,
      gramas: v.gramas,
      participacao: totalG > 0 ? v.gramas / totalG : 0,
    };
  });

  const comTaxa = linhas.filter((l) => l.taxa !== null).sort((a, b) => b.taxa! - a.taxa!);
  const top = comTaxa[0];

  const rotulosTend = Array.from({ length: 10 }, (_, i) => {
    const ini = addDias(inicioTendencia, i * 7);
    if (inicioSemestre) {
      const n = semanasEntre(inicioSemestre, ini) + 1;
      return n >= 1 ? `S${n}` : "—";
    }
    return `S${i + 1}`;
  });

  return {
    periodo,
    refeicao,
    vazio: pratos === 0,
    exemplo,
    rotuloPeriodo: fmtIntervalo(atual.inicio, new Date(ultimaNoPeriodo)),
    semanaSemestre: inicioSemestre ? semanasEntre(inicioSemestre, ref) + 1 : null,
    meta: taxaMeta,
    kpis: {
      pratos,
      pratosAnt: anterior && pratosAnt > 0 ? pratosAnt : null,
      taxaMedia: media(taxa),
      taxaMediaAnt: anterior ? media(taxaAnt) : null,
      gramas,
      classeTop: top ? { classe: top.classe, rotulo: top.rotulo, taxa: top.taxa! } : null,
      rotuloComparacao: ROTULO_COMPARACAO[periodo],
    },
    porClasse: linhas,
    heatmap: CLASSES.map((c) => ({ classe: c, rotulo: ROTULOS[c], valores: heat.get(c)!.map(media) })),
    tendencia: {
      rotulos: rotulosTend,
      geral: semanas.map(media),
      porClasse: Object.fromEntries(CLASSES.map((c) => [c, tend.get(c)!.map(media)])) as Record<
        Classe,
        (number | null)[]
      >,
    },
    frase: fraseParticipacao(linhas, top?.classe),
  };
}

/** "Arroz e feijão somam 43% da massa desperdiçada, mesmo com taxas menores que a da salada: …" */
export function fraseParticipacao(linhas: LinhaClasse[], classeTop?: Classe): string | null {
  const porMassa = [...linhas].filter((l) => l.gramas > 0).sort((a, b) => b.gramas - a.gramas);
  if (porMassa.length < 2) return null;
  const [a, b] = porMassa;
  const soma = Math.round((a.participacao + b.participacao) * 100);
  const nomes = [a, b]
    .map((l) => l.rotulo)
    .sort((x, y) => x.localeCompare(y, "pt-BR"))
    .map((n, i) => (i === 0 ? n : n.toLowerCase()))
    .join(" e ");
  const topLinha = linhas.find((l) => l.classe === classeTop);
  if (
    topLinha &&
    topLinha.classe !== a.classe &&
    topLinha.classe !== b.classe &&
    (a.taxa ?? 0) < (topLinha.taxa ?? 0) &&
    (b.taxa ?? 0) < (topLinha.taxa ?? 0)
  ) {
    const fem = ARTIGO[a.classe] === "a" && ARTIGO[b.classe] === "a";
    return `${nomes} somam ${soma}% da massa desperdiçada, mesmo com taxas menores que a d${ARTIGO[topLinha.classe]} ${topLinha.rotulo.toLowerCase()}: são ${fem ? "servidas" : "servidos"} em maior quantidade.`;
  }
  return `${nomes} somam ${soma}% da massa desperdiçada no período.`;
}
