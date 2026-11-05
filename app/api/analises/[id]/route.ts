import { NextResponse } from "next/server";
import { obterAnalise } from "@/lib/analises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await obterAnalise(id);
  if (!a) return NextResponse.json({ erro: "Análise não encontrada." }, { status: 404 });
  return NextResponse.json(a);
}
