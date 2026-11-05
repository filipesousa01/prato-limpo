/** As 12 classes do modelo desperdicio_ru-fwub5 (Roboflow), na ordem alfabética do ID. */
export const CLASSES = [
  "abobora",
  "arroz",
  "batata",
  "carne_bovina",
  "carne_suina",
  "farofa",
  "feijao",
  "frango_derivados",
  "fruta",
  "macarrao",
  "peixe",
  "salada",
] as const;

export type Classe = (typeof CLASSES)[number];

export const ROTULOS: Record<Classe, string> = {
  abobora: "Abóbora",
  arroz: "Arroz",
  batata: "Batata",
  carne_bovina: "Carne bovina",
  carne_suina: "Carne suína",
  farofa: "Farofa",
  feijao: "Feijão",
  frango_derivados: "Frango e derivados",
  fruta: "Fruta",
  macarrao: "Macarrão",
  peixe: "Peixe",
  salada: "Salada",
};

/** Porção padrão inicial (g) servida no RU. Editável em /configuracoes. */
export const PORCAO_PADRAO_G: Record<Classe, number> = {
  abobora: 60,
  arroz: 150,
  batata: 70,
  carne_bovina: 160,
  carne_suina: 125,
  farofa: 35,
  feijao: 130,
  frango_derivados: 125,
  fruta: 60,
  macarrao: 100,
  peixe: 125,
  salada: 55,
};

export function isClasse(v: string): v is Classe {
  return (CLASSES as readonly string[]).includes(v);
}

export function rotulo(c: string): string {
  return isClasse(c) ? ROTULOS[c] : c;
}

/** Classes em ordem alfabética do rótulo (pt-BR). */
export const CLASSES_POR_ROTULO: Classe[] = [...CLASSES].sort((a, b) =>
  ROTULOS[a].localeCompare(ROTULOS[b], "pt-BR"),
);
