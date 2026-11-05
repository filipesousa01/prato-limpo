"use client";

import type { Classe } from "@/lib/classes";
import { fmtInt, fmtPct } from "@/lib/format";

export type LinhaBarra = { classe: Classe; rotulo: string; taxa: number | null; pratos: number };

/**
 * Barras horizontais com as 12 classes, escala 0–40% (estende se alguma passar).
 * Linha tracejada = meta. Acima da meta: âmbar escuro; dentro: âmbar claro.
 * Cada linha é um botão: clicar destaca a classe no painel inteiro.
 */
export function ClassBarChart({
  linhas,
  meta,
  destaque,
  onDestaque,
}: {
  linhas: LinhaBarra[];
  meta: number;
  destaque: Classe | null;
  onDestaque: (c: Classe | null) => void;
}) {
  const maior = Math.max(0.4, ...linhas.map((l) => l.taxa ?? 0));
  const max = Math.ceil(maior * 10) / 10;
  const ticks = Array.from({ length: Math.round(max * 10) + 1 }, (_, i) => i / 10);
  const pos = (v: number) => `${(v / max) * 100}%`;

  return (
    <div className="cbar">
      <div className="cbar-head" aria-hidden="true">
        <span className="overline">Classe</span>
        <div className="cbar-axis">
          {ticks.map((t) => (
            <span key={t} style={{ left: pos(t) }}>
              {Math.round(t * 100)}%
            </span>
          ))}
        </div>
        <span className="overline" style={{ textAlign: "right" }}>
          Taxa
        </span>
        <span className="overline" style={{ textAlign: "right" }}>
          Pratos
        </span>
      </div>
      <div role="list" aria-label="Taxa de desperdício por classe">
        {linhas.map((l) => {
          const acima = l.taxa !== null && l.taxa > meta;
          const on = destaque === l.classe;
          const dim = destaque !== null && !on;
          const desc =
            l.taxa === null
              ? `${l.rotulo}: sem pratos no período`
              : `${l.rotulo}: ${fmtPct(l.taxa)}, ${fmtInt(l.pratos)} pratos, ${acima ? "acima" : "dentro"} da meta`;
          return (
            <div role="listitem" key={l.classe}>
              <button
                type="button"
                className={`cbar-row ${on ? "is-on" : ""} ${dim ? "is-dim" : ""}`}
                aria-pressed={on}
                aria-label={`${desc}. ${on ? "Remover destaque" : "Destacar no painel"}`}
                onClick={() => onDestaque(on ? null : l.classe)}
              >
                <span className="cbar-name">{l.rotulo}</span>
                <span className="cbar-track">
                  {l.taxa !== null && (
                    <span className={`cbar-fill ${acima ? "acima" : "dentro"}`} style={{ width: pos(l.taxa) }} />
                  )}
                  <span className="cbar-meta" style={{ left: pos(meta) }} />
                </span>
                <span className={`cbar-val ${acima ? "acima" : ""}`}>{l.taxa === null ? "—" : fmtPct(l.taxa)}</span>
                <span className="cbar-n">{fmtInt(l.pratos)}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
