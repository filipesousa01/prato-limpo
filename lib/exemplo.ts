/**
 * Par de fotos de exemplo (bandejas reais do RU em /public/exemplos) e as detecções
 * correspondentes, marcadas à mão sobre as fotos. Servem para testar o fluxo sem
 * chave da Roboflow. Análises de exemplo ficam com origem "DEMO" e NÃO entram no painel.
 *
 * As fotos foram recortadas, giradas 90° (anti-horário, bandeja de frente) e reduzidas para 1200x900; a do prato final
 * foi alinhada à do prato servido para que os compartimentos coincidam no comparador.
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
  p("arroz", 810, 670, 360, 440, 0.93),
  p("feijao", 550, 675, 320, 430, 0.91),
  p("farofa", 170, 717, 246, 360, 0.88),
  p("carne_bovina", 1023, 190, 350, 286, 0.86),
];

export const EXEMPLO_FINAL: PredicaoBruta[] = [
  p("arroz", 533, 838, 240, 124, 0.71),
  p("arroz", 955, 850, 96, 76, 0.64),
  p("feijao", 787, 667, 44, 44, 0.66),
  // pedaços no molho, no compartimento que estava vazio no prato servido
  p("batata", 267, 243, 267, 287, 0.68),
  // migalhas e molho da carne: o modelo ainda vê "carne", mas com pouca confiança → quase não conta como sobra
  p("carne_bovina", 1033, 207, 300, 240, 0.36),
];

/** Usado só pelo gerador de ilustrações antigo (scripts/gerar-exemplos.ts). */
export const EXEMPLO_FINAL_SEM_DESENHO = new Set<string>();
