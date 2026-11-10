"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { IconDownload, IconTarget } from "./icons";
import { Button } from "./ui/Button";
import { SegmentedControl } from "./ui/SegmentedControl";

const SECOES = [
  { value: "inicio", label: "Início" },
  { value: "analise", label: "Análise" },
  { value: "painel", label: "Gráficos" },
] as const;
type Secao = (typeof SECOES)[number]["value"];

function ExportButton() {
  const sp = useSearchParams();
  const q = new URLSearchParams();
  q.set("periodo", sp.get("periodo") ?? "semana");
  q.set("refeicao", sp.get("refeicao") ?? "todas");
  return (
    <Button href={`/api/relatorio?${q.toString()}`} download size="md" variant="primary" icon={<IconDownload />}>
      <span className="hide-sm">Exportar relatório</span>
      <span className="show-sm">CSV</span>
    </Button>
  );
}

/** Seção que ocupa o meio da tela (página inicial). */
function useSecaoVisivel(ativo: boolean): Secao {
  const [atual, setAtual] = useState<Secao>("inicio");
  useEffect(() => {
    if (!ativo) return;
    const els = SECOES.map((s) => document.getElementById(s.value)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setAtual(e.target.id as Secao);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ativo]);
  return atual;
}

function rolarPara(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${id}`);
  return true;
}

export function Header() {
  const path = usePathname() ?? "/";
  const naHome = path === "/";
  const visivel = useSecaoVisivel(naHome);
  const ativa: Secao | "outra" = naHome ? visivel : path.startsWith("/analise") ? "analise" : "outra";

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link
          href="/#inicio"
          className="brand"
          aria-label="Prato Limpo, início"
          onClick={(e) => {
            if (naHome && rolarPara("inicio")) e.preventDefault();
          }}
        >
          <span className="brand-logo" aria-hidden="true">
            <IconTarget size={20} />
          </span>
          <span className="brand-label">
            <span className="brand-name">Prato Limpo</span>
            <span className="brand-sub">Restaurante Universitário da UFMA</span>
          </span>
        </Link>

        <SegmentedControl
          mode="nav"
          label="Seções"
          className="site-nav"
          value={ativa}
          options={SECOES.map((s) => ({ value: s.value, label: s.label, href: `/#${s.value}` }))}
          onItemClick={(v, e) => {
            if (naHome && rolarPara(v)) e.preventDefault();
          }}
        />

        <div className="site-header-end">
          {naHome && (
            <Suspense fallback={null}>
              <ExportButton />
            </Suspense>
          )}
        </div>
      </div>
    </header>
  );
}
