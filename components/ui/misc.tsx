import type { ReactNode } from "react";
import { IconCheck } from "../icons";

/* ---------- MetricTile ---------- */

export function MetricTile({
  label,
  value,
  unit,
  foot,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  foot?: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="card metric-tile">
      <p className="metric-label">{label}</p>
      <p className={["metric", valueClassName ?? ""].join(" ")}>
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </p>
      {foot && <div className="metric-foot caption">{foot}</div>}
    </div>
  );
}

/* ---------- ClassPill ---------- */

export function ClassPill({ children }: { children: ReactNode }) {
  return <span className="class-pill">{children}</span>;
}

/* ---------- EmptyState ---------- */

export function EmptyState({
  icon,
  title,
  children,
  action,
  tone = "neutral",
}: {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <div className={`empty empty-${tone}`} role={tone === "error" ? "alert" : undefined}>
      {icon && <div className="empty-icon">{icon}</div>}
      <p className="empty-title">{title}</p>
      {children && <div className="empty-body caption">{children}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

/* ---------- Stepper ---------- */

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="stepper" aria-label="Etapas da análise">
      {steps.map((s, i) => {
        const estado = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={s} className={`step step-${estado}`} aria-current={estado === "current" ? "step" : undefined}>
            <span className="step-dot" aria-hidden="true">
              {estado === "done" ? <IconCheck size={14} /> : i + 1}
            </span>
            <span className="step-label">
              {s}
              <span className="sr-only">
                {estado === "done" ? " (concluída)" : estado === "current" ? " (etapa atual)" : ""}
              </span>
            </span>
            {i < steps.length - 1 && <span className="step-line" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

/* ---------- Skeleton ---------- */

export function Skeleton({ h = 16, w = "100%", r }: { h?: number; w?: number | string; r?: number }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}
