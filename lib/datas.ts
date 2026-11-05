/**
 * Datas no fuso do RU (São Luís · America/Fortaleza, UTC−3, sem horário de verão).
 * Todos os agrupamentos (dia, semana, mês) usam este fuso, independente do servidor.
 */
export const FUSO = "America/Fortaleza";
const OFFSET_MS = -3 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

/** Partes da data no horário local do RU. diaSemana: 0 = domingo … 6 = sábado. */
export function partes(d: Date) {
  const l = new Date(d.getTime() + OFFSET_MS);
  return {
    ano: l.getUTCFullYear(),
    mes: l.getUTCMonth(),
    dia: l.getUTCDate(),
    diaSemana: l.getUTCDay(),
    hora: l.getUTCHours(),
  };
}

/** Instante (UTC) correspondente a uma data/hora local do RU. */
export function localParaInstante(ano: number, mes: number, dia: number, hora = 0, min = 0): Date {
  return new Date(Date.UTC(ano, mes, dia, hora, min) - OFFSET_MS);
}

export function inicioDoDia(d: Date): Date {
  const p = partes(d);
  return localParaInstante(p.ano, p.mes, p.dia);
}

export function addDias(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DIA_MS);
}

/** Segunda-feira 00:00 da semana de d. */
export function inicioDaSemana(d: Date): Date {
  const ini = inicioDoDia(d);
  const ds = partes(d).diaSemana;
  const desdeSegunda = (ds + 6) % 7;
  return addDias(ini, -desdeSegunda);
}

export function inicioDoMes(d: Date): Date {
  const p = partes(d);
  return localParaInstante(p.ano, p.mes, 1);
}

export function addMeses(d: Date, n: number): Date {
  const p = partes(d);
  return localParaInstante(p.ano, p.mes + n, p.dia);
}

/** Índice 0..4 para seg..sex; null para fim de semana. */
export function indiceDiaUtil(d: Date): number | null {
  const ds = partes(d).diaSemana;
  return ds >= 1 && ds <= 5 ? ds - 1 : null;
}

export function semanasEntre(a: Date, b: Date): number {
  return Math.floor((inicioDaSemana(b).getTime() - inicioDaSemana(a).getTime()) / (7 * DIA_MS));
}

export const DIAS_UTEIS = ["Seg", "Ter", "Qua", "Qui", "Sex"] as const;
export const DIAS_UTEIS_LONGOS = ["segunda", "terça", "quarta", "quinta", "sexta"] as const;
