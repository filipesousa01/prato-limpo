"use client";

import { useCallback, useRef, useState } from "react";
import { IconGrip } from "./icons";

export type Caixa = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  confianca?: number;
  rotulo?: string;
  titulo: string;
};

/** Abaixo disso a sobra é tratada visualmente como "provável osso/resto". */
export const CONFIANCA_FRACA = 0.6;

/** Caixa de detecção (coordenadas normalizadas 0..1, centro + tamanho). */
export function DetectionBox({ caixa }: { caixa: Caixa }) {
  const left = (caixa.x - caixa.w / 2) * 100;
  const top = (caixa.y - caixa.h / 2) * 100;
  const fraca = caixa.confianca !== undefined && caixa.confianca < CONFIANCA_FRACA;
  return (
    <div
      className={`det-box ${fraca ? "det-box-fraca" : ""}`}
      style={{ left: `${left}%`, top: `${top}%`, width: `${caixa.w * 100}%`, height: `${caixa.h * 100}%` }}
      title={caixa.titulo}
    >
      {caixa.rotulo && <span className={`det-label ${top < 8 ? "det-label-in" : ""}`}>{caixa.rotulo}</span>}
    </div>
  );
}

type Props = {
  idealUrl: string;
  finalUrl: string;
  /** largura / altura da foto final */
  proporcao: number;
  caixas: Caixa[];
  mostrarCaixas: boolean;
};

/**
 * Comparador antes e depois: foto ideal à esquerda, final à direita,
 * com divisor arrastável (mouse, toque e setas do teclado).
 */
export function BeforeAfterSlider({ idealUrl, finalUrl, proporcao, caixas, mostrarCaixas }: Props) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const arrastando = useRef(false);

  const mover = useCallback((clientX: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const passo = e.shiftKey ? 10 : 2;
    let n = pos;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") n = pos - passo;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") n = pos + passo;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = 100;
    else if (e.key === "PageDown") n = pos - 10;
    else if (e.key === "PageUp") n = pos + 10;
    else return;
    e.preventDefault();
    setPos(Math.min(100, Math.max(0, n)));
  };

  return (
    <div
      ref={ref}
      className="ba"
      style={{ aspectRatio: String(proporcao) }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        arrastando.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        mover(e.clientX);
      }}
      onPointerMove={(e) => arrastando.current && mover(e.clientX)}
      onPointerUp={() => (arrastando.current = false)}
      onPointerCancel={() => (arrastando.current = false)}
    >
      {/* camada de baixo: prato final (com as caixas de sobra) */}
      <div className="ba-layer">
        {/* eslint-disable-next-line @next/next/no-img-element -- fotos do armazenamento, tamanho variável */}
        <img src={finalUrl} alt="Prato final, devolvido com as sobras" className="ba-img" draggable={false} />
        {mostrarCaixas && caixas.map((c) => <DetectionBox key={c.id} caixa={c} />)}
      </div>

      {/* camada de cima: prato ideal, recortada até o divisor */}
      <div className="ba-layer ba-top" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- fotos do armazenamento, tamanho variável */}
        <img src={idealUrl} alt="Prato ideal, como foi servido" className="ba-img" draggable={false} />
      </div>

      <span className="ba-tag ba-tag-l" style={{ opacity: pos < 18 ? 0 : 1 }}>
        Prato ideal
      </span>
      <span className="ba-tag ba-tag-r" style={{ opacity: pos > 82 ? 0 : 1 }}>
        Prato final
      </span>

      <div className="ba-divider" style={{ left: `${pos}%` }} aria-hidden="true" />
      <div
        className="ba-handle"
        style={{ left: `${pos}%` }}
        role="slider"
        tabIndex={0}
        aria-label="Divisor entre prato ideal e prato final"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos)}
        aria-valuetext={`${Math.round(pos)}% do prato ideal visível`}
        onKeyDown={onKeyDown}
      >
        <IconGrip size={18} />
      </div>
    </div>
  );
}
