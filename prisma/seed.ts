/**
 * Seed · ~10 semanas de DADOS DE EXEMPLO para as 12 classes.
 * Salada e abóbora têm as maiores taxas; arroz e feijão, as maiores massas.
 * Remove só as análises de exemplo anteriores (origem = "EXEMPLO"); dados reais ficam.
 *
 *   npm run db:seed
 */
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { CLASSES, type Classe, PORCAO_PADRAO_G } from "../lib/classes";
import { addDias, inicioDaSemana, partes, localParaInstante } from "../lib/datas";
import { taxaPonderada } from "../lib/desperdicio";

const prisma = new PrismaClient();

/* PRNG determinístico, para o seed ser reproduzível */
function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20261030);
const entre = (a: number, b: number) => a + (b - a) * rnd();

/** taxa média de cada classe na semana 10 */
const TAXA_BASE: Record<Classe, number> = {
  salada: 0.314,
  abobora: 0.278,
  batata: 0.221,
  feijao: 0.196,
  fruta: 0.189,
  farofa: 0.172,
  peixe: 0.158,
  arroz: 0.143,
  macarrao: 0.136,
  carne_suina: 0.124,
  frango_derivados: 0.107,
  carne_bovina: 0.092,
};

/** chance de a classe estar no prato */
const PRESENCA: Record<Classe, number> = {
  salada: 0.858,
  abobora: 0.321,
  batata: 0.379,
  feijao: 0.949,
  fruta: 0.544,
  farofa: 0.51,
  peixe: 0.18,
  arroz: 0.982,
  macarrao: 0.294,
  carne_suina: 0.248,
  frango_derivados: 0.47,
  carne_bovina: 0.406,
};

/** área típica no prato ideal (fração da imagem) */
const AREA_TIPICA: Record<Classe, number> = {
  arroz: 0.13,
  feijao: 0.1,
  salada: 0.08,
  frango_derivados: 0.06,
  carne_bovina: 0.06,
  carne_suina: 0.055,
  peixe: 0.055,
  macarrao: 0.07,
  batata: 0.05,
  abobora: 0.045,
  fruta: 0.04,
  farofa: 0.035,
};

/** a turma vai aprendendo ao longo do semestre: S1 ≈ 21,4% → S10 ≈ 16,8% */
const FATOR_SEMANA = [1.27, 1.24, 1.31, 1.17, 1.14, 1.11, 1.13, 1.06, 1.03, 1.0];
/** sexta sobra mais, quarta menos (como no mapa de calor) */
const FATOR_DIA = [1.03, 0.98, 0.94, 1.0, 1.1];
const FATOR_REFEICAO = { ALMOCO: 0.97, JANTAR: 1.06 } as const;
const PRATOS_SEMANA = [1102, 1150, 1210, 1180, 1195, 1230, 1170, 1205, 1188, 1284];
const PESO_DIA = [1.02, 1.0, 1.03, 1.0, 0.95];

function taxaSorteada(media: number): number {
  // ~35% dos pratos voltam limpos; o resto espalha em torno da média
  if (rnd() < 0.35) return 0;
  const t = (media / 0.65) * entre(0.4, 1.6);
  return Math.min(1, Math.max(0, t));
}

/** Semana 10 = última semana útil completa antes de hoje. */
function segundaDaSemana10(agora: Date): Date {
  const ds = partes(agora).diaSemana;
  const estaSemana = inicioDaSemana(agora);
  return ds === 0 || ds === 6 ? estaSemana : addDias(estaSemana, -7);
}

async function main() {
  const s10 = segundaDaSemana10(new Date());
  const s1 = addDias(s10, -63);

  console.log("Limpando dados de exemplo anteriores…");
  await prisma.analise.deleteMany({ where: { origem: "EXEMPLO" } });

  for (const c of CLASSES) {
    await prisma.configClasse.upsert({
      where: { classe: c },
      create: { classe: c, porcaoPadraoG: PORCAO_PADRAO_G[c] },
      update: {},
    });
  }
  await prisma.meta.upsert({
    where: { id: 1 },
    create: { id: 1, taxaMeta: 0.15, inicioSemestre: s1 },
    update: { inicioSemestre: s1 },
  });

  const configs = await prisma.configClasse.findMany();
  const porcao = Object.fromEntries(configs.map((c) => [c.classe, c.porcaoPadraoG])) as Record<Classe, number>;

  type A = {
    id: string;
    bandeja: string;
    refeicao: string;
    criadaEm: Date;
    taxaPrato: number;
    gramasDesperdicio: number;
    status: string;
    origem: string;
    modelo: string;
  };
  type R = { analiseId: string; classe: string; areaIdeal: number; areaFinal: number; taxa: number; gramas: number };

  const analises: A[] = [];
  const resultados: R[] = [];
  let bandeja = 0;

  for (let w = 0; w < 10; w++) {
    const segunda = addDias(s1, w * 7);
    const somaPesos = PESO_DIA.reduce((a, b) => a + b, 0);
    for (let d = 0; d < 5; d++) {
      const dia = partes(addDias(segunda, d));
      const nDia = Math.round((PRATOS_SEMANA[w] * PESO_DIA[d]) / somaPesos);
      const nAlmoco = Math.round(nDia * 0.66);
      for (let i = 0; i < nDia; i++) {
        const refeicao = i < nAlmoco ? "ALMOCO" : "JANTAR";
        const minutos =
          refeicao === "ALMOCO" ? 11 * 60 + Math.floor(rnd() * 150) : 17 * 60 + 30 + Math.floor(rnd() * 120);
        const criadaEm = localParaInstante(dia.ano, dia.mes, dia.dia, Math.floor(minutos / 60), minutos % 60);
        const id = randomUUID();
        const fator = FATOR_SEMANA[w] * FATOR_DIA[d] * FATOR_REFEICAO[refeicao] * entre(0.97, 1.03);

        const itens: R[] = [];
        for (const c of CLASSES) {
          if (rnd() > PRESENCA[c]) continue;
          const areaIdeal = AREA_TIPICA[c] * entre(0.75, 1.25);
          const taxa = taxaSorteada(TAXA_BASE[c] * fator);
          itens.push({
            analiseId: id,
            classe: c,
            areaIdeal,
            areaFinal: areaIdeal * taxa,
            taxa,
            gramas: taxa * porcao[c],
          });
        }
        if (itens.length === 0) continue;
        resultados.push(...itens);
        analises.push({
          id,
          bandeja: `B-${String((bandeja++ % 480) + 1).padStart(3, "0")}`,
          refeicao,
          criadaEm,
          taxaPrato: taxaPonderada(itens.map((r) => ({ taxa: r.taxa, peso: r.areaIdeal }))) ?? 0,
          gramasDesperdicio: itens.reduce((s, r) => s + r.gramas, 0),
          status: "CONCLUIDA",
          origem: "EXEMPLO",
          modelo: "desperdicio_ru-fwub5/35",
        });
      }
    }
  }

  console.log(`Inserindo ${analises.length} análises e ${resultados.length} resultados por classe…`);
  const lote = 500;
  for (let i = 0; i < analises.length; i += lote) {
    await prisma.analise.createMany({ data: analises.slice(i, i + lote) });
  }
  for (let i = 0; i < resultados.length; i += lote) {
    await prisma.resultadoClasse.createMany({ data: resultados.slice(i, i + lote) });
  }
  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
