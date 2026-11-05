export const PERIODOS = ["dia", "semana", "mes", "semestre"] as const;
export type Periodo = (typeof PERIODOS)[number];

export const FILTROS_REFEICAO = ["todas", "almoco", "jantar"] as const;
export type FiltroRefeicao = (typeof FILTROS_REFEICAO)[number];

export type Refeicao = "ALMOCO" | "JANTAR";
export type StatusAnalise = "PENDENTE" | "CONCLUIDA" | "ERRO";
export type Origem = "REAL" | "EXEMPLO" | "DEMO";
export type Foto = "IDEAL" | "FINAL";

export const ROTULO_PERIODO: Record<Periodo, string> = {
  dia: "Dia",
  semana: "Semana",
  mes: "Mês",
  semestre: "Semestre",
};

export const ROTULO_FILTRO_REFEICAO: Record<FiltroRefeicao, string> = {
  todas: "Todas",
  almoco: "Almoço",
  jantar: "Jantar",
};

export const ROTULO_REFEICAO: Record<Refeicao, string> = { ALMOCO: "Almoço", JANTAR: "Jantar" };

export function lerPeriodo(v: unknown, padrao: Periodo = "semana"): Periodo {
  return typeof v === "string" && (PERIODOS as readonly string[]).includes(v) ? (v as Periodo) : padrao;
}

export function lerFiltroRefeicao(v: unknown): FiltroRefeicao {
  return typeof v === "string" && (FILTROS_REFEICAO as readonly string[]).includes(v) ? (v as FiltroRefeicao) : "todas";
}

export function lerRefeicao(v: unknown): Refeicao | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  return s === "ALMOCO" || s === "JANTAR" ? s : null;
}

export function filtroParaRefeicao(f: FiltroRefeicao): Refeicao | undefined {
  return f === "almoco" ? "ALMOCO" : f === "jantar" ? "JANTAR" : undefined;
}
