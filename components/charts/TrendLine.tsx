import { fmtPct, fmtPctNum } from "@/lib/format";

/**
 * Linha das últimas semanas com área suave, meta tracejada
 * e o valor da última semana em destaque.
 */
export function TrendLine({
  rotulos,
  valores,
  meta,
  nomeSerie,
}: {
  rotulos: string[];
  valores: (number | null)[];
  meta: number;
  nomeSerie: string;
}) {
  const W = 560;
  const H = 230;
  const m = { t: 16, r: 28, b: 28, l: 40 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const maxV = Math.max(0.4, ...valores.map((v) => v ?? 0));
  const max = Math.ceil(maxV * 10) / 10;
  const ticks = Array.from({ length: Math.round(max * 10) + 1 }, (_, i) => i / 10);
  const n = Math.max(1, rotulos.length - 1);
  const x = (i: number) => m.l + (i / n) * iw;
  const y = (v: number) => m.t + ih - (v / max) * ih;

  // segmentos contínuos (semana sem dados quebra a linha)
  const segs: { i: number; v: number }[][] = [];
  let atual: { i: number; v: number }[] = [];
  valores.forEach((v, i) => {
    if (v === null) {
      if (atual.length) segs.push(atual);
      atual = [];
    } else atual.push({ i, v });
  });
  if (atual.length) segs.push(atual);

  const pontos = valores.map((v, i) => (v === null ? null : { i, v })).filter(Boolean) as { i: number; v: number }[];
  const ultimo = pontos[pontos.length - 1];
  const primeiro = pontos[0];
  const desc = pontos.length
    ? `${nomeSerie}: de ${fmtPct(primeiro.v)} em ${rotulos[primeiro.i]} para ${fmtPct(ultimo.v)} em ${rotulos[ultimo.i]}. Meta ${fmtPct(meta)}.`
    : `${nomeSerie}: sem dados nas últimas semanas.`;

  return (
    <div className="trend">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={desc}>
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: "var(--waste)", stopOpacity: 0.08 }} />
            <stop offset="1" style={{ stopColor: "var(--waste)", stopOpacity: 0.08 }} />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line className="grid-line" x1={m.l} x2={W - m.r} y1={y(t)} y2={y(t)} />
            <text className="axis-label" x={m.l - 8} y={y(t) + 3.5} textAnchor="end">
              {Math.round(t * 100)}%
            </text>
          </g>
        ))}
        {rotulos.map((r, i) => (
          <text key={i} className="axis-label" x={x(i)} y={H - 6} textAnchor="middle">
            {r}
          </text>
        ))}

        {segs.map((s, k) => (
          <g key={k}>
            {s.length > 1 && (
              <path
                className="area"
                d={`M${x(s[0].i)},${y(0)} ${s.map((p) => `L${x(p.i)},${y(p.v)}`).join(" ")} L${x(s[s.length - 1].i)},${y(0)} Z`}
              />
            )}
            <path className="serie" d={s.map((p, j) => `${j ? "L" : "M"}${x(p.i)},${y(p.v)}`).join(" ")} />
          </g>
        ))}

        <line className="meta-line" x1={m.l} x2={W - m.r} y1={y(meta)} y2={y(meta)} />
        <text className="meta-label" x={m.l + 6} y={y(meta) - 6}>
          Meta
        </text>

        {primeiro && <circle className="ponto" cx={x(primeiro.i)} cy={y(primeiro.v)} r={4} />}
        {ultimo && ultimo !== primeiro && <circle className="ponto ponto-final" cx={x(ultimo.i)} cy={y(ultimo.v)} r={4.5} />}
        {ultimo && (
          <text className="valor-final" x={x(ultimo.i)} y={y(ultimo.v) - 12} textAnchor="end">
            {fmtPctNum(ultimo.v)}%
          </text>
        )}
      </svg>

      <table className="sr-only">
        <caption>{nomeSerie}: taxa média de desperdício por semana</caption>
        <thead>
          <tr>
            <th scope="col">Semana</th>
            <th scope="col">Taxa</th>
          </tr>
        </thead>
        <tbody>
          {rotulos.map((r, i) => (
            <tr key={i}>
              <th scope="row">{r}</th>
              <td>{valores[i] === null ? "sem dados" : fmtPct(valores[i]!)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
