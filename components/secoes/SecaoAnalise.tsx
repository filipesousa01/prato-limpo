"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { analisarAction } from "@/app/analise/actions";
import { ResultadoView } from "@/components/ResultadoView";
import { UploadZone } from "@/components/UploadZone";
import { IconAlert, IconImage, IconInfo, IconRedo, IconScan } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Stepper } from "@/components/ui/misc";
import { EVENTO_ANALISE } from "@/lib/eventos";
import { fmtDataHora } from "@/lib/format";
import type { DadosResultado } from "@/lib/resultado";
import { validarFoto } from "@/lib/validacao-cliente";

type Foto = { file: File; url: string; erro: string | null; verificando: boolean; exemplo: boolean };
type Refeicao = "ALMOCO" | "JANTAR";

function refeicaoPadrao(): Refeicao {
  return new Date().getHours() < 15 ? "ALMOCO" : "JANTAR";
}

function rolarAte(el: HTMLElement | null) {
  if (!el) return;
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
}

export function SecaoAnalise() {
  const sp = useSearchParams();
  const [ideal, setIdeal] = useState<Foto | null>(null);
  const [final, setFinal] = useState<Foto | null>(null);
  const [bandeja, setBandeja] = useState(sp.get("bandeja") ?? "");
  const [refeicao, setRefeicao] = useState<Refeicao>(() => {
    const r = sp.get("refeicao");
    return r === "ALMOCO" || r === "JANTAR" ? r : refeicaoPadrao();
  });
  const [erro, setErro] = useState<{ msg: string; tipo: string; analiseId?: string } | null>(null);
  const [resultado, setResultado] = useState<DadosResultado | null>(null);
  const [carregandoExemplo, setCarregandoExemplo] = useState(false);
  const [pendente, iniciar] = useTransition();
  const urls = useRef<string[]>([]);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const secaoRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const lista = urls.current;
    return () => lista.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  useEffect(() => {
    if (resultado) rolarAte(resultadoRef.current);
  }, [resultado]);

  const definir = async (qual: "ideal" | "final", file: File, exemplo = false) => {
    const set = qual === "ideal" ? setIdeal : setFinal;
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    setErro(null);
    setResultado(null);
    set({ file, url, erro: null, verificando: true, exemplo });
    const msg = await validarFoto(file);
    set((atual) => (atual && atual.url === url ? { ...atual, erro: msg, verificando: false } : atual));
  };

  const usarExemplo = async () => {
    setCarregandoExemplo(true);
    setErro(null);
    try {
      const [a, b] = await Promise.all(
        ["/exemplos/prato-ideal.jpg", "/exemplos/prato-final.jpg"].map(async (u) => {
          const r = await fetch(u);
          if (!r.ok) throw new Error();
          return new File([await r.blob()], u.split("/").pop()!, { type: "image/jpeg" });
        }),
      );
      await Promise.all([definir("ideal", a, true), definir("final", b, true)]);
      if (!bandeja) setBandeja("Exemplo");
    } catch {
      setErro({ msg: "Não foi possível carregar as imagens de exemplo.", tipo: "interno" });
    } finally {
      setCarregandoExemplo(false);
    }
  };

  const recomecar = () => {
    setIdeal(null);
    setFinal(null);
    setResultado(null);
    setErro(null);
    rolarAte(secaoRef.current);
  };

  const prontas = !!ideal && !!final && !ideal.erro && !final.erro && !ideal.verificando && !final.verificando;
  const passo = !ideal || ideal.erro ? 0 : !final || final.erro ? 1 : 2;
  const exemplo = !!ideal?.exemplo && !!final?.exemplo;

  const analisar = () => {
    if (!prontas) return;
    setErro(null);
    setResultado(null);
    const fd = new FormData();
    fd.set("ideal", ideal.file);
    fd.set("final", final.file);
    fd.set("bandeja", bandeja);
    fd.set("refeicao", refeicao);
    if (exemplo) fd.set("exemplo", "1");
    iniciar(async () => {
      try {
        const r = await analisarAction(fd);
        if (r.ok) {
          setResultado(r.resultado);
          // análises reais entram no painel: avisa a seção de gráficos para recarregar
          if (r.resultado.origem === "REAL") window.dispatchEvent(new Event(EVENTO_ANALISE));
        } else setErro({ msg: r.erro, tipo: r.tipo, analiseId: r.analiseId });
      } catch {
        setErro({ msg: "Falha de conexão com o servidor. Verifique a rede e tente de novo.", tipo: "interno" });
      }
    });
  };

  return (
    <section id="analise" ref={secaoRef} className="secao secao-analise" aria-labelledby="analise-titulo">
      <div className="container">
        <header className="secao-head">
          <h2 id="analise-titulo" className="page-title">
            Analise um prato
          </h2>
          <p className="secao-lead">
            Envie a foto do prato ideal e a do prato final. O modelo reconhece os alimentos nas duas e estima quanto
            sobrou de cada um.
          </p>
        </header>

        <div className="stack" style={{ gap: 24 }}>
          <div className="card analise-topo">
            <Stepper steps={["Prato ideal", "Prato final", "Análise"]} current={resultado ? 3 : pendente ? 2 : passo} />
            <div className="analise-campos">
              <label className="field">
                <span className="field-label">Bandeja</span>
                <input
                  className="input"
                  value={bandeja}
                  onChange={(e) => setBandeja(e.target.value)}
                  placeholder="Ex.: B-112"
                  maxLength={40}
                  disabled={pendente}
                />
              </label>
              <div className="field">
                <span className="field-label" aria-hidden="true">
                  Refeição
                </span>
                <SegmentedControl
                  label="Refeição"
                  value={refeicao}
                  onChange={setRefeicao}
                  options={[
                    { value: "ALMOCO", label: "Almoço" },
                    { value: "JANTAR", label: "Jantar" },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="analise-uploads">
            <div className="card">
              <UploadZone
                titulo="Prato ideal"
                descricao="Foto tirada quando a refeição é servida."
                previewUrl={ideal?.url ?? null}
                erro={ideal?.erro ?? null}
                verificando={ideal?.verificando}
                desativado={pendente}
                onArquivo={(f) => definir("ideal", f)}
                onRemover={() => {
                  setIdeal(null);
                  setResultado(null);
                }}
              />
            </div>
            <div className="card">
              <UploadZone
                titulo="Prato final"
                descricao="Foto tirada quando a bandeja é devolvida."
                previewUrl={final?.url ?? null}
                erro={final?.erro ?? null}
                verificando={final?.verificando}
                desativado={pendente}
                onArquivo={(f) => definir("final", f)}
                onRemover={() => {
                  setFinal(null);
                  setResultado(null);
                }}
              />
            </div>
          </div>

          <div className="alert alert-info">
            <IconInfo size={16} />
            <span>Fotografe de cima, com o prato inteiro no quadro. Mesmo ângulo e distância nas duas fotos.</span>
          </div>

          {exemplo && (
            <div className="alert alert-waste">
              <IconImage size={16} />
              <span>
                Usando as <strong>imagens de exemplo</strong>: as detecções são pré-definidas, a Roboflow não é chamada e
                o resultado não entra nos gráficos.
              </span>
            </div>
          )}

          {erro && (
            <div className="alert alert-error" role="alert">
              <IconAlert size={16} />
              <span>
                <strong>
                  {erro.tipo === "modelo" ? "Erro do modelo. " : erro.tipo === "validacao" ? "Não deu para analisar. " : ""}
                </strong>
                {erro.msg} {erro.analiseId && <Link href={`/analise/${erro.analiseId}`}>Ver o registro com erro</Link>}
              </span>
            </div>
          )}

          <div className="analise-acoes">
            <Button
              variant="primary"
              size="lg"
              icon={<IconScan />}
              onClick={analisar}
              disabled={!prontas}
              loading={pendente}
              loadingLabel="Analisando…"
            >
              Analisar desperdício
            </Button>
            <button type="button" className="link-btn" onClick={usarExemplo} disabled={pendente || carregandoExemplo}>
              {carregandoExemplo ? "Carregando exemplo…" : "Usar imagem de exemplo"}
            </button>
            <span className="sr-only" aria-live="polite">
              {pendente ? "Analisando as fotos, aguarde." : resultado ? "Resultado pronto, logo abaixo." : ""}
            </span>
          </div>

          {resultado && (
            <div ref={resultadoRef} className="resultado-inline" tabIndex={-1} aria-label="Resultado da análise">
              <div className="resultado-inline-head">
                <div>
                  <h3 className="resultado-titulo">Resultado da análise</h3>
                  <p className="caption">
                    Bandeja {resultado.bandeja}, {resultado.refeicao.toLowerCase()} de{" "}
                    {fmtDataHora(new Date(resultado.criadaEm))}.
                  </p>
                </div>
                <div className="row wrap" style={{ gap: 8 }}>
                  <Button onClick={recomecar} icon={<IconRedo />}>
                    Nova análise
                  </Button>
                  <Button href={`/analise/${resultado.id}`} variant="tertiary">
                    Abrir página do resultado
                  </Button>
                </div>
              </div>
              <ResultadoView dados={resultado} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
