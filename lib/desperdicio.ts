/**
 * Cálculo do desperdício · módulo puro (sem I/O), coberto por desperdicio.test.ts.
 *
 * A área de cada classe vem das caixas delimitadoras do YOLO, normalizadas pela
 * área da imagem. Caixas só APROXIMAM a área do alimento. Se uma detecção trouxer
 * `poligono` (máscara de segmentação), a área do polígono é usada no lugar da caixa;
 * assim a troca para um modelo de segmentação não exige mudar o resto do sistema.
 *
 * No PRATO FINAL cada sobra conta pela área × confiança do modelo. Uma sobra
 * reconhecida com 90% de confiança é comida de verdade e pesa quase inteira;
 * uma reconhecida com 10% provavelmente é osso, casca ou resto e quase não conta.
 * No PRATO IDEAL a comida está inteira, então conta só a área.
 */
import { CLASSES, type Classe, isClasse } from "./classes";

/* ---------- tipos ---------- */

/** Predição como a Roboflow devolve (pixels, x/y = centro da caixa). */
export type PredicaoBruta = {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  class_id?: number;
  /** pontos da máscara em pixels, quando o modelo for de segmentação */
  points?: { x: number; y: number }[];
};

/** Detecção normalizada (0..1 relativo à imagem). */
export type Deteccao = {
  classe: Classe;
  confianca: number;
  x: number;
  y: number;
  w: number;
  h: number;
  poligono?: { x: number; y: number }[];
};

export type ResultadoClasse = {
  classe: Classe;
  areaIdeal: number;
  /** sobra efetiva: Σ(área × confiança) das caixas do prato final */
  areaFinal: number;
  taxa: number;
  gramas: number;
};

export type ResultadoPrato = {
  porClasse: ResultadoClasse[];
  /** null quando nada foi detectado no prato ideal */
  taxaPrato: number | null;
  gramasDesperdicio: number;
  /** classes que só aparecem no prato final (ficam fora da taxa) */
  soNoFinal: Classe[];
};

export type Nivel = "baixo" | "moderado" | "alto";

/* ---------- classes ---------- */

/** "Carne_bovina", "Feijão", "frango derivados" → id interno, ou null se desconhecida. */
export function normalizarClasse(bruta: string): Classe | null {
  const id = bruta
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return isClasse(id) ? id : null;
}

/* ---------- normalização das caixas ---------- */

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function normalizarPredicoes(
  preds: PredicaoBruta[],
  imgW: number,
  imgH: number,
  limiar = 0.4,
): { deteccoes: Deteccao[]; desconhecidas: string[] } {
  if (!(imgW > 0) || !(imgH > 0)) throw new Error("Dimensões da imagem inválidas");
  const deteccoes: Deteccao[] = [];
  const desconhecidas: string[] = [];
  for (const p of preds) {
    if (!(p.confidence >= limiar)) continue;
    const classe = normalizarClasse(String(p.class ?? ""));
    if (!classe) {
      desconhecidas.push(String(p.class));
      continue;
    }
    // recorta a caixa aos limites da imagem
    const x0 = clamp01((p.x - p.width / 2) / imgW);
    const x1 = clamp01((p.x + p.width / 2) / imgW);
    const y0 = clamp01((p.y - p.height / 2) / imgH);
    const y1 = clamp01((p.y + p.height / 2) / imgH);
    const w = x1 - x0;
    const h = y1 - y0;
    if (w <= 0 || h <= 0) continue;
    deteccoes.push({
      classe,
      confianca: p.confidence,
      x: x0 + w / 2,
      y: y0 + h / 2,
      w,
      h,
      poligono: p.points?.length ? p.points.map((pt) => ({ x: clamp01(pt.x / imgW), y: clamp01(pt.y / imgH) })) : undefined,
    });
  }
  return { deteccoes, desconhecidas };
}

/* ---------- área ---------- */

/** Área de um polígono (fórmula do laço), coordenadas normalizadas. */
export function areaPoligono(pts: { x: number; y: number }[]): number {
  if (pts.length < 3) return 0;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

/** Área de uma detecção: máscara se houver, senão a caixa (w × h). */
export function areaDeteccao(d: Deteccao): number {
  return d.poligono && d.poligono.length >= 3 ? areaPoligono(d.poligono) : d.w * d.h;
}

/**
 * area = Σ(width × height) / (imgW × imgH), por classe. Já normalizado.
 * Com `ponderarConfianca`, cada caixa entra como área × confiança (usado no prato final).
 */
export function areaPorClasse(deteccoes: Deteccao[], opcoes: { ponderarConfianca?: boolean } = {}): Map<Classe, number> {
  const m = new Map<Classe, number>();
  for (const d of deteccoes) {
    const peso = opcoes.ponderarConfianca ? clamp01(d.confianca) : 1;
    m.set(d.classe, (m.get(d.classe) ?? 0) + areaDeteccao(d) * peso);
  }
  return m;
}

/* ---------- taxa ---------- */

/**
 * Taxa de desperdício de uma classe = area_final / area_ideal, limitada a [0, 1].
 * null quando a classe não aparece no prato ideal (fica fora da taxa).
 */
export function taxaClasse(areaIdeal: number, areaFinal: number): number | null {
  if (!(areaIdeal > 0)) return null;
  return clamp01((areaFinal > 0 ? areaFinal : 0) / areaIdeal);
}

/** Média das taxas ponderada pela área de cada classe no prato ideal. */
export function taxaPonderada(itens: { taxa: number; peso: number }[]): number | null {
  let soma = 0;
  let pesos = 0;
  for (const { taxa, peso } of itens) {
    if (!(peso > 0)) continue;
    soma += taxa * peso;
    pesos += peso;
  }
  return pesos > 0 ? soma / pesos : null;
}

export function calcularPrato(
  ideal: Deteccao[],
  final: Deteccao[],
  porcoesG: Partial<Record<Classe, number>>,
): ResultadoPrato {
  const aIdeal = areaPorClasse(ideal);
  // sobra efetiva: área × confiança (osso/casca reconhecidos com pouca confiança quase não contam)
  const aFinal = areaPorClasse(final, { ponderarConfianca: true });
  const porClasse: ResultadoClasse[] = [];
  for (const classe of CLASSES) {
    const areaIdeal = aIdeal.get(classe) ?? 0;
    const areaFinal = aFinal.get(classe) ?? 0;
    const taxa = taxaClasse(areaIdeal, areaFinal);
    if (taxa === null) continue;
    porClasse.push({ classe, areaIdeal, areaFinal, taxa, gramas: taxa * (porcoesG[classe] ?? 0) });
  }
  const soNoFinal = CLASSES.filter((c) => !aIdeal.has(c) && aFinal.has(c));
  return {
    porClasse,
    taxaPrato: taxaPonderada(porClasse.map((r) => ({ taxa: r.taxa, peso: r.areaIdeal }))),
    gramasDesperdicio: porClasse.reduce((s, r) => s + r.gramas, 0),
    soNoFinal,
  };
}

/* ---------- níveis ---------- */

/** < 10% baixo · 10% a 25% moderado · > 25% alto */
export function nivel(taxa: number): Nivel {
  if (taxa < 0.1) return "baixo";
  if (taxa <= 0.25) return "moderado";
  return "alto";
}

export const ROTULO_NIVEL: Record<Nivel, string> = {
  baixo: "Baixo",
  moderado: "Moderado",
  alto: "Alto",
};
