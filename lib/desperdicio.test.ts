import { describe, expect, it } from "vitest";
import {
  areaPoligono,
  areaPorClasse,
  calcularPrato,
  type Deteccao,
  nivel,
  normalizarClasse,
  normalizarPredicoes,
  taxaClasse,
  taxaPonderada,
} from "./desperdicio";

const det = (classe: Deteccao["classe"], w: number, h: number, extra: Partial<Deteccao> = {}): Deteccao => ({
  classe,
  confianca: 0.9,
  x: 0.5,
  y: 0.5,
  w,
  h,
  ...extra,
});

describe("normalizarClasse", () => {
  it("aceita maiúsculas, acentos, espaços e hífens", () => {
    expect(normalizarClasse("Carne_bovina")).toBe("carne_bovina");
    expect(normalizarClasse("Feijão")).toBe("feijao");
    expect(normalizarClasse("ABÓBORA")).toBe("abobora");
    expect(normalizarClasse("frango derivados")).toBe("frango_derivados");
    expect(normalizarClasse("  Carne-Suína ")).toBe("carne_suina");
    expect(normalizarClasse("Macarrão")).toBe("macarrao");
  });

  it("devolve null para classe desconhecida", () => {
    expect(normalizarClasse("pizza")).toBeNull();
    expect(normalizarClasse("")).toBeNull();
  });
});

describe("normalizarPredicoes", () => {
  it("normaliza pela área da imagem, para resoluções diferentes ficarem comparáveis", () => {
    const a = normalizarPredicoes([{ x: 100, y: 100, width: 100, height: 50, confidence: 0.9, class: "Arroz" }], 400, 200);
    const b = normalizarPredicoes([{ x: 200, y: 200, width: 200, height: 100, confidence: 0.9, class: "arroz" }], 800, 400);
    expect(a.deteccoes[0].w * a.deteccoes[0].h).toBeCloseTo(0.0625);
    expect(b.deteccoes[0].w * b.deteccoes[0].h).toBeCloseTo(0.0625);
  });

  it("filtra pelo limiar de confiança e separa classes desconhecidas", () => {
    const r = normalizarPredicoes(
      [
        { x: 10, y: 10, width: 10, height: 10, confidence: 0.3, class: "arroz" },
        { x: 10, y: 10, width: 10, height: 10, confidence: 0.8, class: "pizza" },
        { x: 10, y: 10, width: 10, height: 10, confidence: 0.8, class: "Feijao" },
      ],
      100,
      100,
      0.4,
    );
    expect(r.deteccoes.map((d) => d.classe)).toEqual(["feijao"]);
    expect(r.desconhecidas).toEqual(["pizza"]);
  });

  it("recorta caixas que passam da borda da imagem", () => {
    const r = normalizarPredicoes([{ x: 0, y: 50, width: 40, height: 20, confidence: 0.9, class: "batata" }], 100, 100);
    expect(r.deteccoes[0].w).toBeCloseTo(0.2);
    expect(r.deteccoes[0].x).toBeCloseTo(0.1);
  });

  it("rejeita dimensões inválidas", () => {
    expect(() => normalizarPredicoes([], 0, 100)).toThrow();
  });
});

describe("área", () => {
  it("soma as caixas da mesma classe", () => {
    const m = areaPorClasse([det("arroz", 0.2, 0.5), det("arroz", 0.1, 0.1), det("feijao", 0.3, 0.3)]);
    expect(m.get("arroz")).toBeCloseTo(0.11);
    expect(m.get("feijao")).toBeCloseTo(0.09);
    expect(m.has("salada")).toBe(false);
  });

  it("pondera pela confiança só quando pedido", () => {
    const d = [det("frango_derivados", 0.2, 0.5, { confianca: 0.9 }), det("frango_derivados", 0.1, 0.1, { confianca: 0.1 })];
    expect(areaPorClasse(d).get("frango_derivados")).toBeCloseTo(0.11);
    expect(areaPorClasse(d, { ponderarConfianca: true }).get("frango_derivados")).toBeCloseTo(0.09 + 0.001);
  });

  it("usa o polígono da máscara quando existe", () => {
    const quadrado = [
      { x: 0, y: 0 },
      { x: 0.5, y: 0 },
      { x: 0.5, y: 0.5 },
      { x: 0, y: 0.5 },
    ];
    expect(areaPoligono(quadrado)).toBeCloseTo(0.25);
    const m = areaPorClasse([det("arroz", 1, 1, { poligono: quadrado })]);
    expect(m.get("arroz")).toBeCloseTo(0.25);
  });
});

describe("taxaClasse", () => {
  it("é area_final / area_ideal", () => {
    expect(taxaClasse(0.2, 0.05)).toBeCloseTo(0.25);
  });
  it("fica limitada a 1", () => {
    expect(taxaClasse(0.1, 0.3)).toBe(1);
  });
  it("é 0 quando a classe some do prato final", () => {
    expect(taxaClasse(0.1, 0)).toBe(0);
  });
  it("é null quando a classe não está no prato ideal", () => {
    expect(taxaClasse(0, 0.1)).toBeNull();
  });
});

describe("ponderação", () => {
  it("pondera pela área no prato ideal", () => {
    // arroz: área 0,3, taxa 0,1 · salada: área 0,1, taxa 0,5 → (0,03 + 0,05) / 0,4 = 0,2
    expect(taxaPonderada([{ taxa: 0.1, peso: 0.3 }, { taxa: 0.5, peso: 0.1 }])).toBeCloseTo(0.2);
  });
  it("devolve null sem pesos", () => {
    expect(taxaPonderada([])).toBeNull();
  });

  it("calcula o prato completo com gramas", () => {
    const certo = { confianca: 1 };
    const r = calcularPrato(
      [det("arroz", 0.5, 0.6), det("salada", 0.2, 0.5), det("feijao", 0.2, 0.2)],
      [det("arroz", 0.5, 0.06, certo), det("salada", 0.2, 0.25, certo), det("fruta", 0.1, 0.1, certo)],
      { arroz: 160, salada: 60, feijao: 140 },
    );
    const arroz = r.porClasse.find((c) => c.classe === "arroz")!;
    const salada = r.porClasse.find((c) => c.classe === "salada")!;
    const feijao = r.porClasse.find((c) => c.classe === "feijao")!;
    expect(arroz.taxa).toBeCloseTo(0.1);
    expect(arroz.gramas).toBeCloseTo(16);
    expect(salada.taxa).toBeCloseTo(0.5);
    expect(salada.gramas).toBeCloseTo(30);
    expect(feijao.taxa).toBe(0);
    // fruta só aparece no final: fora da taxa
    expect(r.porClasse.some((c) => c.classe === "fruta")).toBe(false);
    expect(r.soNoFinal).toEqual(["fruta"]);
    // (0,1·0,30 + 0,5·0,10 + 0·0,04) / 0,44
    expect(r.taxaPrato).toBeCloseTo(0.08 / 0.44);
    expect(r.gramasDesperdicio).toBeCloseTo(46);
  });

  it("sobra reconhecida com alta confiança pesa muito; com baixa (osso) quase nada", () => {
    const ideal = [det("frango_derivados", 0.2, 0.3, { confianca: 0.95 })]; // área 0,06
    const muita = calcularPrato(ideal, [det("frango_derivados", 0.2, 0.15, { confianca: 0.9 })], { frango_derivados: 120 });
    const osso = calcularPrato(ideal, [det("frango_derivados", 0.2, 0.15, { confianca: 0.1 })], { frango_derivados: 120 });
    // mesma área no final (0,03), confianças diferentes
    expect(muita.porClasse[0].taxa).toBeCloseTo(0.45);
    expect(muita.porClasse[0].gramas).toBeCloseTo(54);
    expect(osso.porClasse[0].taxa).toBeCloseTo(0.05);
    expect(osso.porClasse[0].gramas).toBeCloseTo(6);
  });

  it("a confiança do prato ideal não reduz a área servida", () => {
    const r = calcularPrato(
      [det("arroz", 0.4, 0.5, { confianca: 0.5 })],
      [det("arroz", 0.4, 0.25, { confianca: 1 })],
      { arroz: 150 },
    );
    expect(r.porClasse[0].areaIdeal).toBeCloseTo(0.2);
    expect(r.porClasse[0].taxa).toBeCloseTo(0.5);
  });

  it("taxa do prato é null quando o prato ideal está vazio", () => {
    expect(calcularPrato([], [det("arroz", 0.1, 0.1)], {}).taxaPrato).toBeNull();
  });
});

describe("nivel", () => {
  it("separa baixo, moderado e alto", () => {
    expect(nivel(0)).toBe("baixo");
    expect(nivel(0.0999)).toBe("baixo");
    expect(nivel(0.1)).toBe("moderado");
    expect(nivel(0.25)).toBe("moderado");
    expect(nivel(0.2501)).toBe("alto");
    expect(nivel(1)).toBe("alto");
  });
});
