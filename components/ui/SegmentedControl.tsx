"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";

export type SegOption<V extends string> = { value: V; label: string; href?: string };

type Props<V extends string> = {
  options: SegOption<V>[];
  value: V;
  onChange?: (v: V) => void;
  label: string;
  size?: "sm" | "md";
  /** "nav" usa aria-current (navegação); "radio" usa radiogroup. */
  mode?: "nav" | "radio";
  className?: string;
  /** clique numa opção com href (ex.: rolar até uma seção em vez de navegar) */
  onItemClick?: (v: V, e: React.MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Controle segmentado: trilho cinza-claro e a opção ativa em branco com sombra por baixo,
 * que desliza com animação ao trocar.
 */
export function SegmentedControl<V extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  mode = "radio",
  className,
  onItemClick,
}: Props<V>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const medir = () => {
      const el = track.querySelector<HTMLElement>('[data-active="true"]');
      if (!el) return setThumb(null);
      setThumb({ x: el.offsetLeft, w: el.offsetWidth });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(track);
    return () => ro.disconnect();
  }, [value, options.length]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (mode !== "radio" || !onChange) return;
    const i = options.findIndex((o) => o.value === value);
    let n = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + options.length) % options.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = options.length - 1;
    else return;
    e.preventDefault();
    onChange(options[n].value);
    const btns = trackRef.current?.querySelectorAll<HTMLElement>("[data-seg]");
    btns?.[n]?.focus();
  };

  const Wrapper = mode === "nav" ? "nav" : "div";

  return (
    <Wrapper
      className={["seg", `seg-${size}`, thumb ? "seg-ready" : "", className ?? ""].join(" ")}
      aria-label={label}
      role={mode === "radio" ? "radiogroup" : undefined}
      onKeyDown={onKeyDown}
    >
      <div className="seg-track" ref={trackRef}>
        {thumb && (
          <span
            className="seg-thumb"
            aria-hidden="true"
            style={{ transform: `translateX(${thumb.x}px)`, width: thumb.w }}
          />
        )}
        {options.map((o) => {
          const active = o.value === value;
          const cls = ["seg-item", active ? "is-active" : ""].join(" ");
          if (o.href) {
            return (
              <Link
                key={o.value}
                href={o.href}
                className={cls}
                data-seg
                data-active={active}
                aria-current={active ? (mode === "nav" ? "page" : "true") : undefined}
                scroll={false}
                prefetch={false}
                onClick={onItemClick ? (e) => onItemClick(o.value, e) : undefined}
              >
                {o.label}
              </Link>
            );
          }
          return (
            <button
              key={o.value}
              type="button"
              className={cls}
              data-seg
              data-active={active}
              role={mode === "radio" ? "radio" : undefined}
              aria-checked={mode === "radio" ? active : undefined}
              tabIndex={mode === "radio" ? (active ? 0 : -1) : undefined}
              onClick={() => onChange?.(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </Wrapper>
  );
}
