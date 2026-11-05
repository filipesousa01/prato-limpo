import type { ReactNode } from "react";

export type BadgeTone = "pendente" | "baixo" | "moderado" | "alto" | "erro" | "exemplo" | "info";

const rotulos: Record<BadgeTone, string> = {
  pendente: "Pendente",
  baixo: "Baixo",
  moderado: "Moderado",
  alto: "Alto",
  erro: "Erro",
  exemplo: "dados de exemplo",
  info: "",
};

export function Badge({ tone, children, title }: { tone: BadgeTone; children?: ReactNode; title?: string }) {
  return (
    <span className={`badge badge-${tone}`} title={title}>
      <span className="badge-dot" aria-hidden="true" />
      {children ?? rotulos[tone]}
    </span>
  );
}
