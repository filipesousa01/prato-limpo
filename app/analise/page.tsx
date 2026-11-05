import { redirect } from "next/navigation";

/** A nova análise agora é a 2ª seção da página inicial. */
export default async function AnalisePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.bandeja) q.set("bandeja", sp.bandeja);
  if (sp.refeicao) q.set("refeicao", sp.refeicao);
  const qs = q.toString();
  redirect(`/${qs ? `?${qs}` : ""}#analise`);
}
