/** Escala sequencial do mapa de calor e escolha de cor do texto por contraste (WCAG). */

type RGB = [number, number, number];

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const toHex = (c: RGB) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const lin = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]: RGB) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const contraste = (a: string, b: string) => {
  const x = lum(hex(a));
  const y = lum(hex(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t) as RGB;

const TEMAS = {
  claro: { de: "#FBEEDD", ate: "#8A4205", textoClaro: "#FFFFFF", textoEscuro: "#0D0400" },
  escuro: { de: "#3A2A1A", ate: "#F5A03A", textoClaro: "#FFFFFF", textoEscuro: "#0D0400" },
};

export const ESCALA_MIN = 0.05;
export const ESCALA_MAX = 0.4;

/** Cor da célula e do texto, nos temas claro e escuro, para uma taxa (0..1). */
export function corCalor(taxa: number) {
  const t = Math.min(1, Math.max(0, (taxa - ESCALA_MIN) / (ESCALA_MAX - ESCALA_MIN)));
  const out = {} as Record<"claro" | "escuro", { fundo: string; texto: string }>;
  for (const k of ["claro", "escuro"] as const) {
    const tema = TEMAS[k];
    const fundo = toHex(mix(hex(tema.de), hex(tema.ate), t));
    const texto =
      contraste(fundo, tema.textoClaro) >= contraste(fundo, tema.textoEscuro) ? tema.textoClaro : tema.textoEscuro;
    out[k] = { fundo, texto };
  }
  return out;
}
