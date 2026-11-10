"use client";

import { useState } from "react";
import { IconDownload, IconImage, IconScan, IconSwap, IconTrash } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ClassPill, EmptyState, MetricTile, Skeleton, Stepper } from "@/components/ui/misc";
import { CLASSES, ROTULOS } from "@/lib/classes";

export function DevDemo() {
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes" | "semestre">("semana");
  const [passo, setPasso] = useState(1);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="dev-grid">
        <Card title="Botões" subtitle="Vidro líquido: primário, secundário, terciário, destrutivo">
          <div className="stack" style={{ gap: 12 }}>
            <div className="dev-row">
              <Button variant="primary" icon={<IconScan />}>
                Nova análise
              </Button>
              <Button icon={<IconDownload />}>Exportar relatório</Button>
              <Button variant="tertiary">Terciário</Button>
              <Button variant="danger" icon={<IconTrash />}>
                Excluir
              </Button>
            </div>
            <div className="dev-row">
              <Button size="sm">Pequeno</Button>
              <Button size="md">Médio</Button>
              <Button size="lg" variant="primary">
                Grande
              </Button>
            </div>
            <div className="dev-row">
              <Button variant="primary" loading loadingLabel="Analisando…">
                Analisar
              </Button>
              <Button variant="primary" disabled>
                Desativado
              </Button>
              <IconButton label="Imagem" icon={<IconImage />} />
            </div>
          </div>
        </Card>

        <Card title="Sobre foto" subtitle="Variante onPhoto">
          <div className="dev-photo">
            <Button variant="onPhoto" size="sm" icon={<IconSwap />}>
              Trocar foto
            </Button>
            <IconButton variant="onPhoto" size="sm" label="Remover foto" icon={<IconTrash />} />
          </div>
        </Card>

        <Card title="Controle segmentado" subtitle="A opção ativa desliza">
          <div className="stack" style={{ gap: 12 }}>
            <SegmentedControl
              label="Período"
              value={periodo}
              onChange={setPeriodo}
              options={[
                { value: "dia", label: "Dia" },
                { value: "semana", label: "Semana" },
                { value: "mes", label: "Mês" },
                { value: "semestre", label: "Semestre" },
              ]}
            />
            <SegmentedControl
              size="sm"
              label="Refeição"
              value="todas"
              options={[
                { value: "todas", label: "Todas" },
                { value: "almoco", label: "Almoço" },
                { value: "jantar", label: "Jantar" },
              ]}
            />
          </div>
        </Card>

        <Card title="Badges" subtitle="Níveis de desperdício">
          <div className="dev-row">
            <Badge tone="pendente" />
            <Badge tone="baixo" />
            <Badge tone="moderado" />
            <Badge tone="alto" />
            <Badge tone="erro" />
            <Badge tone="exemplo" />
          </div>
        </Card>

        <Card title="Stepper">
          <div className="stack" style={{ gap: 16 }}>
            <Stepper steps={["Prato ideal", "Prato final", "Análise"]} current={passo} />
            <div className="dev-row">
              <Button size="sm" onClick={() => setPasso((p) => Math.max(0, p - 1))}>
                Voltar
              </Button>
              <Button size="sm" onClick={() => setPasso((p) => Math.min(3, p + 1))}>
                Avançar
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Estados">
          <div className="stack" style={{ gap: 8 }}>
            <Skeleton h={20} w="60%" />
            <Skeleton h={12} />
            <Skeleton h={12} w="80%" />
          </div>
          <EmptyState icon={<IconImage />} title="Nada por aqui">
            Ainda não há análises neste período.
          </EmptyState>
        </Card>
      </div>

      <div className="dev-grid">
        <MetricTile label="Pratos analisados" value="1.284" foot={<span className="delta delta-good">▲ 8,1% vs. semana anterior</span>} />
        <MetricTile label="Taxa média de desperdício" value="16,8" unit="%" />
        <MetricTile label="Classe com maior taxa" value="Salada" valueClassName="metric-serif" />
      </div>

      <Card title="Classes" subtitle="ClassPill">
        <div className="dev-row">
          {CLASSES.map((c) => (
            <ClassPill key={c}>{ROTULOS[c]}</ClassPill>
          ))}
        </div>
      </Card>
    </div>
  );
}
