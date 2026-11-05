"use client";

import { useMemo, useState } from "react";
import { ClassBarChart } from "@/components/charts/ClassBarChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { ShareList } from "@/components/charts/ShareList";
import { TrendLine } from "@/components/charts/TrendLine";
import { IconChart, IconChevronDown, IconScan } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState, MetricTile } from "@/components/ui/misc";
import { CLASSES_POR_ROTULO, type Classe, ROTULOS } from "@/lib/classes";
import { fmtInt, fmtKg, fmtNum, fmtPct, fmtPctNum, fmtPP } from "@/lib/format";
import type { DadosPainel } from "@/lib/painel";

type Ordem = "taxa" | "pratos" | "az";

function Delta({ atual, anterior, tipo }: { atual: number | null; anterior: number | null; tipo: "pct" | "pp" }) {
  if (atual == null || anterior == null || anterior === 0) return null;
  const diff = tipo === "pct" ? (atual - anterior) / anterior : atual - anterior;
  const sobe = diff > 0;
  // pratos: subir é bom (azul) · taxa: descer é bom (azul)
  const bom = tipo === "pct" ? sobe : !sobe;
  const txt = tipo === "pct" ? `${fmtNum(Math.abs(diff * 100), 1)}%` : fmtPP(diff);
  return (
    <span className={`delta ${bom ? "delta-good" : "delta-bad"}`}>
      <span aria-hidden="true">{sobe ? "▲" : "▼"}</span>
      <span className="sr-only">{sobe ? "subiu" : "caiu"}</span> {txt}
    </span>
  );
}

export function PainelView({ dados: d }: { dados: DadosPainel }) {
  const [destaque, setDestaque] = useState<Classe | null>(null);
  const [ordem, setOrdem] = useState<Ordem>("taxa");
  const [serie, setSerie] = useState<"todas" | Classe>("todas");

  const destacar = (c: Classe | null) => {
    setDestaque(c);
    setSerie(c ?? "todas");
  };

  const barras = useMemo(() => {
    const l = [...d.porClasse];
    if (ordem === "taxa") l.sort((a, b) => (b.taxa ?? -1) - (a.taxa ?? -1));
    else if (ordem === "pratos") l.sort((a, b) => b.pratos - a.pratos);
    else l.sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
    return l;
  }, [d.porClasse, ordem]);

  const heat = useMemo(
    () =>
      [...d.heatmap].sort(
        (a, b) =>
          (d.porClasse.find((x) => x.classe === b.classe)?.taxa ?? -1) -
          (d.porClasse.find((x) => x.classe === a.classe)?.taxa ?? -1),
      ),
    [d.heatmap, d.porClasse],
  );

  if (d.vazio) {
    return (
      <Card>
        <EmptyState
          icon={<IconChart />}
          title="Nenhuma análise neste período"
          action={
            <a href="#analise" className="btn btn-md btn-primary">
              <IconScan />
              <span>Nova análise</span>
            </a>
          }
        >
          Ainda não há pratos analisados com estes filtros. Rode o seed (<code>npm run db:seed</code>) para ver dados de
          exemplo, ou envie a primeira análise.
        </EmptyState>
      </Card>
    );
  }

  const k = d.kpis;
  const valoresSerie = serie === "todas" ? d.tendencia.geral : d.tendencia.porClasse[serie];
  const nomeSerie = serie === "todas" ? "Todas as classes" : ROTULOS[serie];
  const comValor = valoresSerie.filter((v): v is number => v !== null);
  const ini = comValor[0] ?? null;
  const fim = comValor[comValor.length - 1] ?? null;
  const variacao = ini !== null && fim !== null ? fim - ini : null;

  return (
    <div className="painel">
      {/* ---------- indicadores ---------- */}
      <div className="kpis">
        <MetricTile
          label="Pratos analisados"
          value={fmtInt(k.pratos)}
          foot={
            k.pratosAnt != null ? (
              <>
                <Delta atual={k.pratos} anterior={k.pratosAnt} tipo="pct" /> {k.rotuloComparacao}
              </>
            ) : (
              "no período selecionado"
            )
          }
        />
        <MetricTile
          label="Taxa média de desperdício"
          value={k.taxaMedia == null ? "—" : fmtPctNum(k.taxaMedia)}
          unit={k.taxaMedia == null ? undefined : "%"}
          foot={
            <>
              {k.taxaMediaAnt != null && (
                <>
                  <Delta atual={k.taxaMedia} anterior={k.taxaMediaAnt} tipo="pp" />,{" "}
                </>
              )}
              meta de <span className="num">{fmtPct(d.meta)}</span>
            </>
          }
        />
        <MetricTile
          label="Comida desperdiçada (estimada)"
          value={fmtNum(k.gramas / 1000, 0)}
          unit="kg"
          foot={<>≈ {fmtInt(k.gramas / 450)} refeições de 450 g</>}
        />
        <MetricTile
          label="Classe com maior taxa"
          value={k.classeTop?.rotulo ?? "—"}
          valueClassName="metric-serif"
          foot={
            k.classeTop && (
              <>
                <span className="num waste-text">{fmtPct(k.classeTop.taxa)}</span> da porção servida
              </>
            )
          }
        />
      </div>

      {destaque && (
        <div className="destaque-bar" role="status">
          <span>
            Destacando <strong>{ROTULOS[destaque]}</strong> no painel
          </span>
          <Button size="sm" variant="tertiary" onClick={() => destacar(null)}>
            Limpar destaque
          </Button>
        </div>
      )}

      {/* ---------- barras + participação ---------- */}
      <div className="painel-row painel-row-2-1">
        <Card
          title="Taxa de desperdício por classe"
          subtitle={`Parte da porção servida que voltou no prato, ${ordem === "taxa" ? "da maior para a menor taxa" : ordem === "pratos" ? "das classes com mais pratos para as com menos" : "em ordem alfabética"}.`}
          actions={
            <SegmentedControl
              size="sm"
              label="Ordenar classes"
              value={ordem}
              onChange={setOrdem}
              options={[
                { value: "taxa", label: "Maior taxa" },
                { value: "pratos", label: "Mais pratos" },
                { value: "az", label: "A–Z" },
              ]}
            />
          }
        >
          <div className="legend" style={{ marginBottom: 14 }}>
            <span>
              <i className="sw" style={{ background: "var(--waste)" }} /> Acima da meta
            </span>
            <span>
              <i className="sw" style={{ background: "var(--waste-light)" }} /> Dentro da meta
            </span>
            <span>
              <i className="sw-meta" /> Meta <span className="num">{fmtPct(d.meta)}</span>
            </span>
            <span className="legend-hint">Clique numa classe para destacá-la</span>
          </div>
          <ClassBarChart linhas={barras} meta={d.meta} destaque={destaque} onDestaque={destacar} />
        </Card>

        <Card
          title="Participação no total desperdiçado"
          subtitle={`${fmtKg(k.gramas, 0)} no período, por classe`}
        >
          <ShareList linhas={d.porClasse} destaque={destaque} />
          {d.frase && <p className="share-note">{d.frase}</p>}
        </Card>
      </div>

      {/* ---------- evolução + mapa de calor ---------- */}
      <div className="painel-row painel-row-1-1">
        <Card
          title="Evolução da taxa no semestre"
          subtitle={`Taxa média nas últimas ${d.tendencia.rotulos.length} semanas, ${serie === "todas" ? "todas as classes" : nomeSerie.toLowerCase()}.`}
          actions={
            <label className="select-btn">
              <span className="sr-only">Classe exibida na evolução</span>
              <select value={serie} onChange={(e) => setSerie(e.target.value as "todas" | Classe)}>
                <option value="todas">Todas as classes</option>
                {CLASSES_POR_ROTULO.map((c) => (
                  <option key={c} value={c}>
                    {ROTULOS[c]}
                  </option>
                ))}
              </select>
              <IconChevronDown size={14} />
            </label>
          }
        >
          <TrendLine rotulos={d.tendencia.rotulos} valores={valoresSerie} meta={d.meta} nomeSerie={nomeSerie} />
          <div className="trend-stats">
            <div>
              <p>Início do semestre</p>
              <p>{ini === null ? "—" : fmtPct(ini)}</p>
            </div>
            <div>
              <p>Semana atual</p>
              <p>{fim === null ? "—" : fmtPct(fim)}</p>
            </div>
            <div>
              <p>Variação</p>
              <p className={`nowrap ${variacao === null ? "" : variacao <= 0 ? "brand-text" : "waste-text"}`}>
                {variacao === null ? (
                  "—"
                ) : (
                  <>
                    <span aria-hidden="true">{variacao <= 0 ? "▼" : "▲"}</span>
                    <span className="sr-only">{variacao <= 0 ? "queda de" : "alta de"}</span> {fmtPP(variacao)}
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Taxa por classe e dia da semana" subtitle="Quanto mais escuro, mais sobra no prato">
          <Heatmap linhas={heat} destaque={destaque} />
        </Card>
      </div>

      {/* ---------- metodologia ---------- */}
      <Card className="metodo">
        <div className="metodo-texto">
          <h2 className="card-title">Como a taxa é medida</h2>
          <p>
            Cada bandeja é fotografada antes e depois da refeição. O modelo detecta as 12 classes nas duas fotos. A taxa
            de uma classe é a sobra efetiva (área × confiança do modelo) dividida pela área servida: o que ele reconhece
            com pouca confiança, como osso ou casca, quase não conta.
          </p>
          <p className="caption">
            A detecção usa caixas delimitadoras, então a área é aproximada. Segmentação deixaria a medida mais precisa.
          </p>
        </div>
        <div className="metodo-pills">
          <div className="pills">
            <span className="pill num">YOLOv11n, versão 35</span>
            <span className="pill num">mAP@50 72,9%</span>
            <span className="pill num">Precisão 81,8%</span>
            <span className="pill num">Revocação 68,7%</span>
            <span className="pill num">1.405 imagens anotadas</span>
          </div>
          <a href="#modelo" className="btn btn-md btn-secondary">
            <span>Ver detalhes do modelo</span>
          </a>
        </div>
      </Card>
    </div>
  );
}
