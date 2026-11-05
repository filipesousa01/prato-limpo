import type { CSSProperties } from "react";
import type { Classe } from "@/lib/classes";
import { ESCALA_MAX, ESCALA_MIN, corCalor } from "@/lib/cores";
import { DIAS_UTEIS, DIAS_UTEIS_LONGOS } from "@/lib/datas";
import { fmtPctNum } from "@/lib/format";

export type LinhaCalor = { classe: Classe; rotulo: string; valores: (number | null)[] };

/** Mapa de calor classe × dia útil. É uma tabela real, então leitores de tela leem os valores. */
export function Heatmap({ linhas, destaque }: { linhas: LinhaCalor[]; destaque: Classe | null }) {
  return (
    <div>
      <table className="heat">
        <caption className="sr-only">Taxa de desperdício (%) por classe e dia da semana</caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Classe</span>
            </th>
            {DIAS_UTEIS.map((d, i) => (
              <th key={d} scope="col">
                <abbr title={DIAS_UTEIS_LONGOS[i]} style={{ textDecoration: "none" }}>
                  {d}
                </abbr>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.classe} className={destaque && destaque !== l.classe ? "is-dim" : ""}>
              <th scope="row">{l.rotulo}</th>
              {l.valores.map((v, i) => {
                if (v === null)
                  return (
                    <td key={i} className="vazio">
                      <span aria-label="sem dados">—</span>
                    </td>
                  );
                const c = corCalor(v);
                const style = { "--hl": c.claro.fundo, "--tl": c.claro.texto } as CSSProperties;
                return (
                  <td key={i} style={style} className="heat-cell">
                    {fmtPctNum(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="heat-scale" aria-hidden="true">
        <span>{Math.round(ESCALA_MIN * 100)}%</span>
        <span className="bar" />
        <span>{Math.round(ESCALA_MAX * 100)}%</span>
      </div>
    </div>
  );
}
