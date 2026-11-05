"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IconAlert, IconScan } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { DadosPainel } from "@/lib/painel";
import {
  type FiltroRefeicao,
  FILTROS_REFEICAO,
  type Periodo,
  PERIODOS,
  ROTULO_FILTRO_REFEICAO,
  ROTULO_PERIODO,
} from "@/lib/tipos";
import { EVENTO_ANALISE } from "@/lib/eventos";
import { PainelView } from "./PainelView";

const TEXTO_REFEICAO = { todas: "almoço e jantar", almoco: "almoço", jantar: "jantar" } as const;

/**
 * Seção de gráficos. Os filtros buscam /api/painel no navegador (sem recarregar a página
 * nem perder a rolagem) e ficam na URL via history.replaceState, que o cabeçalho lê para exportar.
 */
export function SecaoPainel({ inicial }: { inicial: DadosPainel }) {
  const [dados, setDados] = useState(inicial);
  const [periodo, setPeriodo] = useState<Periodo>(inicial.periodo);
  const [refeicao, setRefeicao] = useState<FiltroRefeicao>(inicial.refeicao);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const pedido = useRef(0);

  const carregar = useCallback(async (p: Periodo, r: FiltroRefeicao) => {
    const id = ++pedido.current;
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/painel?periodo=${p}&refeicao=${r}`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const d = (await res.json()) as DadosPainel;
      if (id === pedido.current) setDados(d);
    } catch {
      if (id === pedido.current) setErro("Não foi possível carregar os gráficos. Verifique a conexão e tente de novo.");
    } finally {
      if (id === pedido.current) setCarregando(false);
    }
  }, []);

  const filtrar = (p: Periodo, r: FiltroRefeicao) => {
    setPeriodo(p);
    setRefeicao(r);
    const q = new URLSearchParams(window.location.search);
    q.set("periodo", p);
    q.set("refeicao", r);
    window.history.replaceState(null, "", `?${q.toString()}${window.location.hash}`);
    carregar(p, r);
  };

  // nova análise real feita na seção acima → recarrega os gráficos
  useEffect(() => {
    const h = () => carregar(periodo, refeicao);
    window.addEventListener(EVENTO_ANALISE, h);
    return () => window.removeEventListener(EVENTO_ANALISE, h);
  }, [carregar, periodo, refeicao]);

  return (
    <section id="painel" className="secao secao-painel" aria-labelledby="painel-titulo">
      <div className="container">
        <header className="secao-head painel-head">
          <div>
            <h2 id="painel-titulo" className="page-title">
              Painel de desperdício
            </h2>
            <p className="secao-lead">
              {dados.vazio
                ? "Ainda não há pratos analisados com estes filtros."
                : `${dados.semanaSemestre ? `Semana ${dados.semanaSemestre} do semestre: ` : ""}${dados.rotuloPeriodo}, ${TEXTO_REFEICAO[refeicao]}.`}
            </p>
            {dados.exemplo && (
              <p className="aviso-exemplo">
                <Badge tone="moderado">Dados de exemplo</Badge>
                <span className="caption">Gerados pelo seed. Somem quando houver só análises reais.</span>
              </p>
            )}
          </div>
          <div className="painel-filtros">
            <SegmentedControl
              label="Período"
              value={periodo}
              onChange={(p) => filtrar(p, refeicao)}
              options={PERIODOS.map((p) => ({ value: p, label: ROTULO_PERIODO[p] }))}
            />
            <SegmentedControl
              label="Refeição"
              value={refeicao}
              onChange={(r) => filtrar(periodo, r)}
              options={FILTROS_REFEICAO.map((r) => ({ value: r, label: ROTULO_FILTRO_REFEICAO[r] }))}
            />
            <a href="#analise" className="btn btn-md btn-primary">
              <IconScan />
              <span>Nova análise</span>
            </a>
          </div>
        </header>

        {erro && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 24 }}>
            <IconAlert size={16} />
            <span>
              {erro}{" "}
              <Button size="sm" variant="tertiary" onClick={() => carregar(periodo, refeicao)}>
                Tentar de novo
              </Button>
            </span>
          </div>
        )}

        <div className={`painel-corpo ${carregando ? "is-loading" : ""}`} aria-busy={carregando}>
          <PainelView dados={dados} />
        </div>
        <span className="sr-only" aria-live="polite">
          {carregando ? "Atualizando gráficos…" : ""}
        </span>
      </div>
    </section>
  );
}
