import { NextResponse } from "next/server";
import { criarAnalise } from "@/lib/analises";
import { tokenValido } from "@/lib/auth";
import { obterHistorico } from "@/lib/historico";
import { ErroValidacao } from "@/lib/imagem";
import { ErroModelo } from "@/lib/roboflow";
import { lerFiltroRefeicao, lerPeriodo, lerRefeicao } from "@/lib/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/analises · multipart/form-data
 *   ideal (JPG/PNG ≤ 10 MB), final (JPG/PNG ≤ 10 MB), bandeja (texto), refeicao (ALMOCO|JANTAR)
 * Header obrigatório: Authorization: Bearer <INGEST_TOKEN>  (ou x-ingest-token)
 */
export async function POST(req: Request) {
  if (!process.env.INGEST_TOKEN) {
    return NextResponse.json({ erro: "INGEST_TOKEN não configurado no servidor." }, { status: 503 });
  }
  if (!tokenValido(req)) {
    return NextResponse.json({ erro: "Token inválido ou ausente." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ erro: "Envie multipart/form-data com os campos ideal, final, bandeja e refeicao." }, { status: 400 });
  }

  const refeicao = lerRefeicao(form.get("refeicao"));
  if (!refeicao) return NextResponse.json({ erro: "refeicao deve ser ALMOCO ou JANTAR." }, { status: 400 });

  try {
    const analise = await criarAnalise({
      ideal: form.get("ideal"),
      final: form.get("final"),
      bandeja: String(form.get("bandeja") ?? ""),
      refeicao,
    });
    return NextResponse.json(analise, { status: 201 });
  } catch (e) {
    if (e instanceof ErroValidacao || e instanceof ErroModelo) {
      return NextResponse.json({ erro: e.message, analiseId: e.analiseId ?? null }, { status: e.status });
    }
    console.error("[POST /api/analises]", e);
    return NextResponse.json({ erro: "Erro interno ao processar a análise." }, { status: 500 });
  }
}

/** GET /api/analises?page=1&periodo=todos|dia|semana|mes|semestre&refeicao=todas|almoco|jantar */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const periodoBruto = sp.get("periodo");
  const dados = await obterHistorico({
    pagina: Number(sp.get("page") ?? "1") || 1,
    periodo: periodoBruto && periodoBruto !== "todos" ? lerPeriodo(periodoBruto) : "todos",
    refeicao: lerFiltroRefeicao(sp.get("refeicao")),
  });
  return NextResponse.json(dados);
}
