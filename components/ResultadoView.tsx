import { Comparacao } from "./Comparacao";
import { RingLegend, WasteRing } from "./charts/WasteRing";
import { IconImage } from "./icons";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";
import { EmptyState } from "./ui/misc";
import { nivel } from "@/lib/desperdicio";
import { fmtG, fmtPct } from "@/lib/format";
import type { DadosResultado } from "@/lib/resultado";

/** Comparação + anel + tabela por alimento. Funciona no servidor e no cliente. */
export function ResultadoView({ dados: r }: { dados: DadosResultado }) {
  const nv = nivel(r.taxaPrato);
  return (
    <div className="resultado-grid">
      <div className="resultado-main">
        {r.fotos ? (
          <Comparacao
            idealUrl={r.fotos.idealUrl}
            finalUrl={r.fotos.finalUrl}
            proporcao={r.fotos.proporcao}
            caixas={r.caixas}
          />
        ) : (
          <Card title="Comparação">
            <EmptyState icon={<IconImage />} title="Sem fotos">
              Esta análise faz parte dos dados de exemplo e não tem fotos. Os números ao lado vêm do seed.
            </EmptyState>
          </Card>
        )}
      </div>

      <div className="resultado-side">
        <Card title="Resultado" subtitle="Taxa do prato, ponderada pela área de cada alimento">
          <div className="resultado-ring">
            <WasteRing taxa={r.taxaPrato} />
            <Badge tone={nv}>Desperdício {nv}</Badge>
            <RingLegend consumidoG={Math.max(0, r.servidoG - r.sobraG)} sobraG={r.sobraG} />
          </div>
          <p className="caption resultado-nota">
            Cada sobra conta pela área × confiança do modelo: o que ele reconhece com pouca confiança (osso, casca,
            resto) quase não entra. Gramas estimadas pela porção padrão de cada classe. As caixas delimitadoras só
            aproximam a área.
          </p>
        </Card>

        <Card title="Por alimento" subtitle={`${r.porClasse.length} classes no prato ideal`}>
          {r.porClasse.length === 0 ? (
            <EmptyState title="Nenhum alimento detectado" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Classe</th>
                  <th scope="col" className="r">
                    Confiança
                  </th>
                  <th scope="col" className="r">
                    Sobra
                  </th>
                  <th scope="col" className="r">
                    Taxa
                  </th>
                </tr>
              </thead>
              <tbody>
                {r.porClasse.map((c) => (
                  <tr key={c.classe}>
                    <th scope="row" className="td-classe">
                      {c.rotulo}
                    </th>
                    <td className="r num muted">{c.confianca == null ? "—" : `${Math.round(c.confianca * 100)}%`}</td>
                    <td className="r num">{fmtG(c.gramas)}</td>
                    <td className="r nowrap">
                      <span className="mini-bar" aria-hidden="true">
                        <span style={{ width: `${Math.round(c.taxa * 100)}%` }} />
                      </span>
                      <span className={`num ${c.taxa > 0.25 ? "waste-text" : ""}`}>{fmtPct(c.taxa)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="caption" style={{ marginTop: 12 }}>
            Confiança: média do modelo nas sobras daquela classe no prato final. “—” = não sobrou nada.
          </p>
          {r.soNoFinal.length > 0 && (
            <p className="caption" style={{ marginTop: 8 }}>
              {r.soNoFinal.join(", ")} apareceu só no prato final e ficou fora do cálculo.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
