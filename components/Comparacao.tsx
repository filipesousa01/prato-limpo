"use client";

import { useState } from "react";
import { BeforeAfterSlider, type Caixa } from "./BeforeAfterSlider";
import { Card } from "./ui/Card";
import { SegmentedControl } from "./ui/SegmentedControl";

export function Comparacao({
  idealUrl,
  finalUrl,
  proporcao,
  caixas,
}: {
  idealUrl: string;
  finalUrl: string;
  proporcao: number;
  caixas: Caixa[];
}) {
  const [modo, setModo] = useState<"det" | "fotos">("det");
  return (
    <Card
      title="Comparação"
      subtitle="Arraste o divisor ou use as setas do teclado"
      actions={
        <SegmentedControl
          size="sm"
          label="Exibição"
          value={modo}
          onChange={setModo}
          options={[
            { value: "det", label: "Com detecções" },
            { value: "fotos", label: "Só fotos" },
          ]}
        />
      }
    >
      <BeforeAfterSlider
        idealUrl={idealUrl}
        finalUrl={finalUrl}
        proporcao={proporcao}
        caixas={caixas}
        mostrarCaixas={modo === "det"}
      />
      {caixas.length > 0 ? (
        <div className="legend" style={{ marginTop: 12 }}>
          <span>
            <i className="sw-box" /> Sobra reconhecida com confiança
          </span>
          <span>
            <i className="sw-box sw-box-fraca" /> Pouca confiança: provável osso ou resto, conta pouco
          </span>
        </div>
      ) : (
        <p className="caption" style={{ marginTop: 12 }}>
          Nenhuma sobra foi detectada no prato final.
        </p>
      )}
    </Card>
  );
}
