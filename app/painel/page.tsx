import { redirect } from "next/navigation";

/** O painel agora é a 3ª seção da página inicial. */
export default async function PainelPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  if (sp.periodo) q.set("periodo", sp.periodo);
  if (sp.refeicao) q.set("refeicao", sp.refeicao);
  const qs = q.toString();
  redirect(`/${qs ? `?${qs}` : ""}#painel`);
}
