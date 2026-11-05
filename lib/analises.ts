import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { CLASSES, type Classe, PORCAO_PADRAO_G } from "./classes";
import { prisma } from "./db";
import { type Deteccao, calcularPrato, normalizarPredicoes } from "./desperdicio";
import { armazenamento } from "./armazenamento";
import {
  EXEMPLO_FINAL,
  EXEMPLO_FINAL_URL,
  EXEMPLO_H,
  EXEMPLO_IDEAL,
  EXEMPLO_IDEAL_URL,
  EXEMPLO_W,
} from "./exemplo";
import { type ArquivoValidado, ErroValidacao, validarArquivo } from "./imagem";
import { configRoboflow, ErroModelo, inferir } from "./roboflow";
import type { Refeicao } from "./tipos";

export async function porcoesPadrao(): Promise<Record<Classe, number>> {
  const cfg = await prisma.configClasse.findMany();
  const out = { ...PORCAO_PADRAO_G };
  for (const c of cfg) if ((CLASSES as readonly string[]).includes(c.classe)) out[c.classe as Classe] = c.porcaoPadraoG;
  return out;
}

export type EntradaAnalise = {
  ideal: unknown;
  final: unknown;
  bandeja: string;
  refeicao: Refeicao;
  /** usa as imagens de exemplo embutidas (sem chamar a Roboflow) */
  exemplo?: boolean;
};

async function detectar(arq: ArquivoValidado) {
  const { predicoes, w, h } = await inferir(arq.bytes);
  const imgW = w ?? arq.w;
  const imgH = h ?? arq.h;
  const { deteccoes, desconhecidas } = normalizarPredicoes(predicoes, imgW, imgH, configRoboflow().confianca);
  if (desconhecidas.length) console.warn(`[analise] classes desconhecidas ignoradas: ${[...new Set(desconhecidas)].join(", ")}`);
  return deteccoes;
}

/**
 * Valida, guarda as fotos, roda as duas inferências, calcula e salva.
 * Lança ErroValidacao (400) ou ErroModelo (502); no segundo caso a análise fica salva com status ERRO.
 */
export async function criarAnalise(e: EntradaAnalise) {
  const bandeja = e.bandeja.trim().slice(0, 40) || "—";
  let ideal: Deteccao[];
  let final: Deteccao[];
  let fotos: { idealUrl: string; finalUrl: string; idealW: number; idealH: number; finalW: number; finalH: number };

  if (e.exemplo) {
    // fotos de exemplo já estão em /public/exemplos
    await readFile(path.join(process.cwd(), "public", EXEMPLO_IDEAL_URL)).catch(() => {
      throw new ErroValidacao("As imagens de exemplo não foram encontradas no servidor.");
    });
    ideal = normalizarPredicoes(EXEMPLO_IDEAL, EXEMPLO_W, EXEMPLO_H).deteccoes;
    final = normalizarPredicoes(EXEMPLO_FINAL, EXEMPLO_W, EXEMPLO_H).deteccoes;
    fotos = {
      idealUrl: EXEMPLO_IDEAL_URL,
      finalUrl: EXEMPLO_FINAL_URL,
      idealW: EXEMPLO_W,
      idealH: EXEMPLO_H,
      finalW: EXEMPLO_W,
      finalH: EXEMPLO_H,
    };
    return salvar({ bandeja, refeicao: e.refeicao, origem: "DEMO", modelo: "exemplo (detecções pré-definidas)", fotos, ideal, final });
  }

  const [arqIdeal, arqFinal] = await Promise.all([
    validarArquivo(e.ideal, "prato ideal"),
    validarArquivo(e.final, "prato final"),
  ]);
  const [idealUrl, finalUrl] = await Promise.all([
    armazenamento.salvar(arqIdeal.bytes, arqIdeal.ext),
    armazenamento.salvar(arqFinal.bytes, arqFinal.ext),
  ]);
  fotos = { idealUrl, finalUrl, idealW: arqIdeal.w, idealH: arqIdeal.h, finalW: arqFinal.w, finalH: arqFinal.h };
  const cfg = configRoboflow();
  const modelo = `${cfg.modelo}/${cfg.versao}`;

  try {
    [ideal, final] = await Promise.all([detectar(arqIdeal), detectar(arqFinal)]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido no modelo.";
    const a = await prisma.analise.create({
      data: {
        bandeja,
        refeicao: e.refeicao,
        fotoIdealUrl: idealUrl,
        fotoFinalUrl: finalUrl,
        idealW: fotos.idealW,
        idealH: fotos.idealH,
        finalW: fotos.finalW,
        finalH: fotos.finalH,
        status: "ERRO",
        mensagemErro: msg,
        origem: "REAL",
        modelo,
      },
    });
    const erro = err instanceof ErroModelo ? err : new ErroModelo(msg);
    erro.analiseId = a.id;
    throw erro;
  }

  if (ideal.length === 0) {
    const a = await prisma.analise.create({
      data: {
        bandeja,
        refeicao: e.refeicao,
        fotoIdealUrl: idealUrl,
        fotoFinalUrl: finalUrl,
        idealW: fotos.idealW,
        idealH: fotos.idealH,
        finalW: fotos.finalW,
        finalH: fotos.finalH,
        status: "ERRO",
        mensagemErro: "Nenhum alimento foi reconhecido na foto do prato ideal.",
        origem: "REAL",
        modelo,
      },
    });
    const erro = new ErroValidacao(
      "Nenhum alimento foi reconhecido no prato ideal. Fotografe de cima, com o prato inteiro e boa luz.",
    );
    erro.analiseId = a.id;
    throw erro;
  }

  return salvar({ bandeja, refeicao: e.refeicao, origem: "REAL", modelo, fotos, ideal, final });
}

async function salvar(d: {
  bandeja: string;
  refeicao: Refeicao;
  origem: "REAL" | "DEMO";
  modelo: string;
  fotos: { idealUrl: string; finalUrl: string; idealW: number; idealH: number; finalW: number; finalH: number };
  ideal: Deteccao[];
  final: Deteccao[];
}) {
  const porcoes = await porcoesPadrao();
  const r = calcularPrato(d.ideal, d.final, porcoes);
  const det = (foto: "IDEAL" | "FINAL", x: Deteccao) => ({
    foto,
    classe: x.classe,
    confianca: x.confianca,
    x: x.x,
    y: x.y,
    w: x.w,
    h: x.h,
  });
  const a = await prisma.analise.create({
    data: {
      bandeja: d.bandeja,
      refeicao: d.refeicao,
      fotoIdealUrl: d.fotos.idealUrl,
      fotoFinalUrl: d.fotos.finalUrl,
      idealW: d.fotos.idealW,
      idealH: d.fotos.idealH,
      finalW: d.fotos.finalW,
      finalH: d.fotos.finalH,
      taxaPrato: r.taxaPrato,
      gramasDesperdicio: r.gramasDesperdicio,
      status: "CONCLUIDA",
      origem: d.origem,
      modelo: d.modelo,
      deteccoes: { create: [...d.ideal.map((x) => det("IDEAL", x)), ...d.final.map((x) => det("FINAL", x))] },
      resultados: { create: r.porClasse.map((c) => ({ ...c })) },
    },
  });
  return obterAnalise(a.id);
}

export async function obterAnalise(id: string) {
  return prisma.analise.findUnique({
    where: { id },
    include: {
      deteccoes: { orderBy: { confianca: "desc" } },
      resultados: { orderBy: { gramas: "desc" } },
    },
  });
}

export type AnaliseCompleta = NonNullable<Awaited<ReturnType<typeof obterAnalise>>>;
