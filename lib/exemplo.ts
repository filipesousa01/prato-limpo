/**
 * Par de imagens de exemplo (ilustrações em /public/exemplos) e as detecções
 * correspondentes. Servem para testar o fluxo sem fotos e sem chave da Roboflow.
 * Análises de exemplo ficam com origem "DEMO" e NÃO entram no painel.
 */
import type { PredicaoBruta } from "./desperdicio";

export const EXEMPLO_W = 1200;
export const EXEMPLO_H = 900;
export const EXEMPLO_IDEAL_URL = "/exemplos/prato-ideal.jpg";
export const EXEMPLO_FINAL_URL = "/exemplos/prato-final.jpg";

const p = (cls: string, x: number, y: number, width: number, height: number, confidence: number): PredicaoBruta => ({
  class: cls,
  x,
  y,
  width,
  height,
  confidence,
});

export const EXEMPLO_IDEAL: PredicaoBruta[] = [
  p("arroz", 470, 330, 300, 220, 0.93),
  p("feijao", 745, 320, 240, 190, 0.91),
  p("salada", 430, 595, 260, 200, 0.88),
  p("frango_derivados", 720, 595, 220, 160, 0.86),
  p("abobora", 890, 470, 120, 110, 0.81),
  p("farofa", 295, 460, 110, 100, 0.77),
];

export const EXEMPLO_FINAL: PredicaoBruta[] = [
  p("arroz", 455, 345, 150, 96, 0.84),
  p("feijao", 760, 330, 84, 62, 0.72),
  p("salada", 425, 600, 190, 140, 0.87),
  p("abobora", 885, 475, 92, 82, 0.8),
  // osso do frango: o modelo ainda vê "frango", mas com pouca confiança → quase não conta como sobra
  p("frango_derivados", 820, 567, 130, 70, 0.42),
];

/** Detecções que não devem ser desenhadas como comida na ilustração (o osso já está no desenho). */
export const EXEMPLO_FINAL_SEM_DESENHO = new Set(["frango_derivados"]);
