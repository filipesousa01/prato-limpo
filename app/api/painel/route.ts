import { NextResponse } from "next/server";
import { obterPainel } from "@/lib/painel";
import { lerFiltroRefeicao, lerPeriodo } from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/painel?periodo=dia|semana|mes|semestre&refeicao=todas|almoco|jantar */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const dados = await obterPainel(lerPeriodo(sp.get("periodo")), lerFiltroRefeicao(sp.get("refeicao")));
  return NextResponse.json(dados);
}
