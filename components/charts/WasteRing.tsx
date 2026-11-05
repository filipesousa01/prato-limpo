import { fmtG, fmtPctNum } from "@/lib/format";

/** Anel: consumido (azul) e sobra (âmbar), com o % desperdiçado no centro. */
export function WasteRing({ taxa, size = 200 }: { taxa: number; size?: number }) {
  const t = Math.min(1, Math.max(0, taxa));
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = t > 0 && t < 1 ? 4 : 0; // pequena folga entre os arcos
  const sobra = Math.max(0, c * t - gap);
  const consumido = Math.max(0, c * (1 - t) - gap);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${fmtPctNum(t)}% do prato desperdiçado e ${fmtPctNum(1 - t)}% consumido`}
      className="ring"
    >
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke} strokeLinecap="butt">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--track)" />
        {consumido > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--brand)"
            strokeDasharray={`${consumido} ${c}`}
            strokeDashoffset={-(c * t + gap / 2)}
          />
        )}
        {sobra > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="var(--waste)"
            strokeDasharray={`${sobra} ${c}`}
            strokeDashoffset={-gap / 2}
          />
        )}
      </g>
      <text x="50%" y="48%" textAnchor="middle" className="ring-value">
        {fmtPctNum(t)}
        <tspan className="ring-unit">%</tspan>
      </text>
      <text x="50%" y="62%" textAnchor="middle" className="ring-caption">
        desperdiçado
      </text>
    </svg>
  );
}

export function RingLegend({ consumidoG, sobraG }: { consumidoG: number; sobraG: number }) {
  return (
    <ul className="ring-legend">
      <li>
        <span className="dot dot-brand" aria-hidden="true" />
        <span>Consumido</span>
        <strong className="num">{fmtG(consumidoG)}</strong>
      </li>
      <li>
        <span className="dot dot-waste" aria-hidden="true" />
        <span>Sobra</span>
        <strong className="num">{fmtG(sobraG)}</strong>
      </li>
    </ul>
  );
}
