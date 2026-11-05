import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ResultadoView } from "@/components/ResultadoView";
import { IconAlert, IconImage, IconInfo, IconRedo, IconScan } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/misc";
import { obterAnalise, porcoesPadrao } from "@/lib/analises";
import { fmtDataHora } from "@/lib/format";
import { montarResultado } from "@/lib/resultado";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  return { title: `Resultado ${id.slice(0, 8)}` };
}

export default async function ResultadoPage({ params }: Params) {
  const { id } = await params;
  const a = await obterAnalise(id);
  if (!a) notFound();

  const r = montarResultado(a, await porcoesPadrao());
  const refazer = `/?bandeja=${encodeURIComponent(a.bandeja)}&refeicao=${a.refeicao}#analise`;

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Resultado da análise</h1>
          <p className="secao-lead">
            Bandeja {r.bandeja}, {r.refeicao.toLowerCase()} de {fmtDataHora(a.criadaEm)}.
          </p>
          <p className="caption">
            {a.origem === "EXEMPLO"
              ? "Análise dos dados de exemplo, gerada pelo seed e sem fotos."
              : a.modelo
                ? `Modelo ${a.modelo}.`
                : null}
          </p>
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          <Button href={refazer} icon={<IconRedo />}>
            Refazer
          </Button>
          <Button href="/#analise" variant="primary" icon={<IconScan />}>
            Nova análise
          </Button>
        </div>
      </div>

      {a.origem === "DEMO" && (
        <div className="alert alert-waste" style={{ marginBottom: 24 }}>
          <IconImage size={16} />
          <span>
            Demonstração com as imagens de exemplo: as detecções são pré-definidas e esta análise não entra nos gráficos.
          </span>
        </div>
      )}

      {a.status === "ERRO" ? (
        <Card>
          <EmptyState
            tone="error"
            icon={<IconAlert />}
            title="A análise não foi concluída"
            action={
              <>
                <Button href={refazer} icon={<IconRedo />}>
                  Tentar de novo
                </Button>
                <Button href="/" variant="tertiary">
                  Voltar ao início
                </Button>
              </>
            }
          >
            {a.mensagemErro ?? "Erro desconhecido."}
          </EmptyState>
        </Card>
      ) : a.status === "PENDENTE" ? (
        <Card>
          <EmptyState icon={<IconInfo />} title="Análise em processamento">
            Atualize a página em alguns segundos.
          </EmptyState>
        </Card>
      ) : (
        <ResultadoView dados={r} />
      )}
    </div>
  );
}
