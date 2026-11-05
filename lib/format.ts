/** Formatação no padrão brasileiro: 16,8% · 1.284 · 31,6 kg */
import { FUSO, partes } from "./datas";

const nf = (min: number, max: number) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: min, maximumFractionDigits: max });

const inteiro = nf(0, 0);
const umaCasa = nf(1, 1);

export function fmtInt(n: number): string {
  return inteiro.format(Math.round(n));
}

export function fmtNum(n: number, casas = 1): string {
  return nf(casas, casas).format(n);
}

/** Recebe fração (0,168) e devolve "16,8%". */
export function fmtPct(frac: number, casas = 1): string {
  return `${nf(casas, casas).format(frac * 100)}%`;
}

/** Só o número percentual, sem o símbolo: 0,168 → "16,8". */
export function fmtPctNum(frac: number, casas = 1): string {
  return nf(casas, casas).format(frac * 100);
}

/** Variação em pontos percentuais com sinal: "0,5 p.p." */
export function fmtPP(deltaFrac: number): string {
  return `${umaCasa.format(Math.abs(deltaFrac * 100))} p.p.`;
}

export function fmtKg(gramas: number, casas = 1): string {
  return `${nf(casas, casas).format(gramas / 1000)} kg`;
}

export function fmtG(gramas: number): string {
  return `${inteiro.format(Math.round(gramas))} g`;
}

const meses = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function nomeMes(m: number): string {
  return meses[m];
}

/** "26 a 30 de outubro de 2026" ou "28 de setembro a 2 de outubro de 2026". */
export function fmtIntervalo(inicio: Date, fim: Date): string {
  const p1 = partes(inicio);
  const p2 = partes(fim);
  const [d1, d2, m1, m2, a1, a2] = [p1.dia, p2.dia, p1.mes, p2.mes, p1.ano, p2.ano];
  if (a1 === a2 && m1 === m2) {
    if (d1 === d2) return `${d1} de ${meses[m1]} de ${a1}`;
    return `${d1} a ${d2} de ${meses[m1]} de ${a1}`;
  }
  if (a1 === a2) return `${d1} de ${meses[m1]} a ${d2} de ${meses[m2]} de ${a1}`;
  return `${d1} de ${meses[m1]} de ${a1} a ${d2} de ${meses[m2]} de ${a2}`;
}

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: FUSO,
});
const hora = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO });

export function fmtData(d: Date): string {
  return dataCurta.format(d);
}

export function fmtDataHora(d: Date): string {
  return `${dataCurta.format(d)} às ${hora.format(d)}`;
}
