import type { Classe } from "@/lib/classes";
import { fmtPct } from "@/lib/format";

export type LinhaShare = { classe: Classe; rotulo: string; gramas: number; participacao: number };

/** Participação de cada classe no total desperdiçado, com barra fina. */
export function ShareList({ linhas, destaque }: { linhas: LinhaShare[]; destaque: Classe | null }) {
  const ordenadas = [...linhas].sort((a, b) => b.participacao - a.participacao);
  const max = Math.max(...ordenadas.map((l) => l.participacao), 0.0001);
  return (
    <ul className="share" aria-label="Participação de cada classe no total desperdiçado">
      {ordenadas.map((l) => (
        <li
          key={l.classe}
          className={`share-item ${destaque && destaque !== l.classe ? "is-dim" : ""}`}
          aria-current={destaque === l.classe || undefined}
        >
          <div>
            <span className="share-name">{l.rotulo}</span>
            <div className="share-bar" aria-hidden="true">
              <span style={{ width: `${(l.participacao / max) * 100}%` }} />
            </div>
          </div>
          <span className="share-pct">{fmtPct(l.participacao)}</span>
        </li>
      ))}
    </ul>
  );
}
