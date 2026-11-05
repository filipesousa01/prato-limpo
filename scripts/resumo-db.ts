/** Resumo rápido do banco: npx tsx scripts/resumo-db.ts */
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const [n, r, ult, pri] = await Promise.all([
    p.analise.count(),
    p.resultadoClasse.count(),
    p.analise.findFirst({ orderBy: { criadaEm: "desc" } }),
    p.analise.findFirst({ orderBy: { criadaEm: "asc" } }),
  ]);
  const porOrigem = await p.analise.groupBy({ by: ["origem"], _count: true });
  console.log({ analises: n, resultados: r, primeira: pri?.criadaEm, ultima: ult?.criadaEm, porOrigem });
}

main().finally(() => p.$disconnect());
