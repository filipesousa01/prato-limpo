import { Suspense } from "react";
import { SecaoAnalise } from "@/components/secoes/SecaoAnalise";
import { SecaoInicio } from "@/components/secoes/SecaoInicio";
import { SecaoPainel } from "@/components/secoes/SecaoPainel";
import { obterPainel } from "@/lib/painel";
import { lerFiltroRefeicao, lerPeriodo } from "@/lib/tipos";

export const dynamic = "force-dynamic";

/**
 * Página única com rolagem suave:
 *   01 #inicio  · o projeto (hero, como funciona)
 *   02 #analise · nova análise, com o resultado logo abaixo
 *   03 #painel  · gráficos
 */
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const painel = await obterPainel(lerPeriodo(sp.periodo), lerFiltroRefeicao(sp.refeicao));

  return (
    <>
      <SecaoInicio />
      <Suspense fallback={<section id="analise" className="secao" />}>
        <SecaoAnalise />
      </Suspense>
      <SecaoPainel inicial={painel} />
    </>
  );
}
