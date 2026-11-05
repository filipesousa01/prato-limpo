/** Cria uma análise DEMO com as imagens de exemplo (sem Roboflow). npx tsx scripts/criar-demo.ts */
import { PrismaClient } from "@prisma/client";
import { PORCAO_PADRAO_G } from "../lib/classes";
import { calcularPrato, normalizarPredicoes } from "../lib/desperdicio";
import { EXEMPLO_FINAL, EXEMPLO_FINAL_URL, EXEMPLO_H, EXEMPLO_IDEAL, EXEMPLO_IDEAL_URL, EXEMPLO_W } from "../lib/exemplo";

const p = new PrismaClient();

async function main() {
  await p.analise.deleteMany({ where: { origem: "DEMO" } });
  const ideal = normalizarPredicoes(EXEMPLO_IDEAL, EXEMPLO_W, EXEMPLO_H).deteccoes;
  const final = normalizarPredicoes(EXEMPLO_FINAL, EXEMPLO_W, EXEMPLO_H).deteccoes;
  const r = calcularPrato(ideal, final, PORCAO_PADRAO_G);
  const det = (foto: string) => (d: (typeof ideal)[number]) => ({ foto, classe: d.classe, confianca: d.confianca, x: d.x, y: d.y, w: d.w, h: d.h });
  const a = await p.analise.create({
    data: {
      bandeja: "Exemplo",
      refeicao: "ALMOCO",
      fotoIdealUrl: EXEMPLO_IDEAL_URL,
      fotoFinalUrl: EXEMPLO_FINAL_URL,
      idealW: EXEMPLO_W,
      idealH: EXEMPLO_H,
      finalW: EXEMPLO_W,
      finalH: EXEMPLO_H,
      taxaPrato: r.taxaPrato,
      gramasDesperdicio: r.gramasDesperdicio,
      status: "CONCLUIDA",
      origem: "DEMO",
      modelo: "exemplo (detecções pré-definidas)",
      deteccoes: { create: [...ideal.map(det("IDEAL")), ...final.map(det("FINAL"))] },
      resultados: { create: r.porClasse },
    },
  });
  console.log(a.id);
}

main().finally(() => p.$disconnect());
