/**
 * Gera as ilustrações de exemplo (prato ideal e prato final) a partir das caixas de lib/exemplo.ts.
 *   npx tsx scripts/gerar-exemplos.ts
 *
 * ATENÇÃO: hoje /public/exemplos tem FOTOS REAIS de bandejas. Rodar este script as
 * substitui por ilustrações desenhadas.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { PredicaoBruta } from "../lib/desperdicio";
import { EXEMPLO_FINAL, EXEMPLO_FINAL_SEM_DESENHO, EXEMPLO_H, EXEMPLO_IDEAL, EXEMPLO_W } from "../lib/exemplo";

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function pontosNaElipse(r: () => number, cx: number, cy: number, rx: number, ry: number, n: number) {
  const out: [number, number][] = [];
  while (out.length < n) {
    const u = r() * 2 - 1;
    const v = r() * 2 - 1;
    if (u * u + v * v <= 1) out.push([cx + u * rx, cy + v * ry]);
  }
  return out;
}

function comida(p: PredicaoBruta, seed: number): string {
  const r = rng(seed);
  const cx = p.x;
  const cy = p.y;
  const rx = p.width / 2;
  const ry = p.height / 2;
  const area = rx * ry;
  const grupo: string[] = [];
  const base = (cor: string) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.96}" ry="${ry * 0.96}" fill="${cor}" filter="url(#sombra)"/>`;

  switch (p.class) {
    case "arroz":
      grupo.push(base("#efe9da"));
      for (const [x, y] of pontosNaElipse(r, cx, cy, rx * 0.92, ry * 0.92, Math.round(area / 40)))
        grupo.push(
          `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5" ry="2.2" fill="${r() > 0.5 ? "#fffdf6" : "#e2dac6"}" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`,
        );
      break;
    case "feijao":
      grupo.push(base("#4a2a1a"));
      for (const [x, y] of pontosNaElipse(r, cx, cy, rx * 0.9, ry * 0.9, Math.round(area / 90)))
        grupo.push(
          `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7" ry="4.5" fill="${r() > 0.5 ? "#6b3b22" : "#3a1f12"}" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`,
        );
      break;
    case "salada":
      for (const [x, y] of pontosNaElipse(r, cx, cy, rx * 0.85, ry * 0.85, Math.round(area / 260)))
        grupo.push(
          `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${18 + r() * 14}" ry="${9 + r() * 6}" fill="${["#5d9b3a", "#7bb84c", "#3f7d2a", "#9ccc65"][Math.floor(r() * 4)]}" transform="rotate(${Math.round(r() * 180)} ${x.toFixed(1)} ${y.toFixed(1)})" filter="url(#sombra)"/>`,
        );
      for (const [x, y] of pontosNaElipse(r, cx, cy, rx * 0.7, ry * 0.7, Math.max(2, Math.round(area / 2600))))
        grupo.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13" fill="#d8402e" filter="url(#sombra)"/>`);
      break;
    case "frango_derivados":
      for (const [x, y] of pontosNaElipse(r, cx, cy, rx * 0.6, ry * 0.55, 5))
        grupo.push(
          `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx * 0.42}" ry="${ry * 0.38}" fill="${r() > 0.5 ? "#c98a3e" : "#b5742c"}" filter="url(#sombra)"/>`,
        );
      break;
    case "abobora":
      for (const [x, y] of pontosNaElipse(r, cx, cy, rx * 0.7, ry * 0.7, Math.max(4, Math.round(area / 380))))
        grupo.push(
          `<rect x="${(x - 14).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="28" height="28" rx="6" fill="${r() > 0.5 ? "#f08a24" : "#e07a12"}" transform="rotate(${Math.round(r() * 60)} ${x.toFixed(1)} ${y.toFixed(1)})" filter="url(#sombra)"/>`,
        );
      break;
    case "farofa":
      grupo.push(base("#d9b779"));
      for (const [x, y] of pontosNaElipse(r, cx, cy, rx * 0.9, ry * 0.9, Math.round(area / 18)))
        grupo.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="${r() > 0.5 ? "#c49a52" : "#ead2a0"}"/>`);
      break;
  }
  return `<g>${grupo.join("")}</g>`;
}

function svg(preds: PredicaoBruta[], seed: number, sujo: boolean) {
  const W = EXEMPLO_W;
  const H = EXEMPLO_H;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="prato" cx="50%" cy="45%" r="55%">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".85" stop-color="#f3f5f8"/><stop offset="1" stop-color="#dfe4ec"/>
    </radialGradient>
    <linearGradient id="bandeja" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8fa3b8"/><stop offset="1" stop-color="#6d8299"/>
    </linearGradient>
    <filter id="sombra" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity=".22"/>
    </filter>
    <filter id="sombraPrato"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#0b1b33" flood-opacity=".35"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bandeja)"/>
  <rect x="40" y="30" width="${W - 80}" height="${H - 60}" rx="40" fill="#7b90a6" opacity=".55"/>
  <circle cx="600" cy="460" r="400" fill="url(#prato)" filter="url(#sombraPrato)"/>
  <circle cx="600" cy="460" r="330" fill="none" stroke="#e6eaf0" stroke-width="3"/>
  ${sujo ? `<g opacity=".35">${[...Array(14)].map((_, i) => `<circle cx="${380 + ((i * 97) % 460)}" cy="${240 + ((i * 61) % 420)}" r="${3 + (i % 4)}" fill="#a07a50"/>`).join("")}</g>` : ""}
  ${preds.map((p, i) => comida(p, seed + i * 7)).join("\n")}
  ${sujo ? `<rect x="760" y="560" width="120" height="14" rx="7" fill="#e8dcc5" transform="rotate(-25 820 567)" filter="url(#sombra)"/>` : ""}
</svg>`;
}

async function main() {
  const dir = path.join(process.cwd(), "public", "exemplos");
  await mkdir(dir, { recursive: true });
  await sharp(Buffer.from(svg(EXEMPLO_IDEAL, 11, false)))
    .jpeg({ quality: 86 })
    .toFile(path.join(dir, "prato-ideal.jpg"));
  await sharp(Buffer.from(svg(EXEMPLO_FINAL.filter((p) => !EXEMPLO_FINAL_SEM_DESENHO.has(p.class)), 23, true)))
    .jpeg({ quality: 86 })
    .toFile(path.join(dir, "prato-final.jpg"));
  console.log("Exemplos gerados em public/exemplos/");
}

main();
