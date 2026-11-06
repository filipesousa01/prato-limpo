import { BeforeAfterSlider, type Caixa } from "@/components/BeforeAfterSlider";
import { IconChart, IconScan } from "@/components/icons";
import { ClassPill } from "@/components/ui/misc";
import { CLASSES_POR_ROTULO, ROTULOS, rotulo } from "@/lib/classes";
import {
  EXEMPLO_FINAL,
  EXEMPLO_FINAL_URL,
  EXEMPLO_H,
  EXEMPLO_IDEAL_URL,
  EXEMPLO_W,
} from "@/lib/exemplo";
import { normalizarClasse } from "@/lib/desperdicio";

/** Caixas do prato final de exemplo, no formato do comparador. */
const caixasHero: Caixa[] = EXEMPLO_FINAL.map((p, i) => {
  const nome = rotulo(normalizarClasse(p.class) ?? p.class);
  const pct = Math.round(p.confidence * 100);
  return {
    id: `ex-${i}`,
    x: p.x / EXEMPLO_W,
    y: p.y / EXEMPLO_H,
    w: p.width / EXEMPLO_W,
    h: p.height / EXEMPLO_H,
    confianca: p.confidence,
    rotulo: `${nome} ${pct}%`,
    titulo: `${nome}, confiança ${pct}%`,
  };
});

const PASSOS = [
  {
    titulo: "Fotografar",
    texto:
      "Cada bandeja é fotografada duas vezes, de cima: quando a refeição é servida e quando a bandeja volta.",
  },
  {
    titulo: "Reconhecer",
    texto:
      "Um modelo YOLOv11n encontra os 12 alimentos do cardápio nas duas fotos. Cada sobra pesa pela área vezes a confiança do modelo, então osso e casca, que ele mal reconhece, quase não contam.",
  },
  {
    titulo: "Medir",
    texto:
      "A sobra dividida pela área servida dá a taxa de desperdício de cada alimento. Os gráficos acompanham isso por dia, semana e semestre.",
  },
];

export function SecaoInicio() {
  return (
    <section id="inicio" className="secao secao-inicio" aria-labelledby="inicio-titulo">
      <div className="container hero">
        <div className="hero-texto">
          <h1 id="inicio-titulo" className="hero-titulo">
            Prato Limpo
          </h1>
          <p className="hero-frase">Desperdício alimentar medido por visão computacional</p>
          <p className="hero-lead">
            Uma pesquisa de Iniciação Científica do VisionLab que mede quanto da comida servida no Restaurante
            Universitário da UFMA volta no prato. Com isso, o RU pode ajustar porções e cardápio a partir de dados, não de
            impressões.
          </p>
          <div className="hero-acoes">
            <a href="#analise" className="btn btn-lg btn-primary">
              <IconScan />
              <span>Analisar um prato</span>
            </a>
            <a href="#painel" className="btn btn-lg btn-secondary">
              <IconChart />
              <span>Ver os gráficos</span>
            </a>
          </div>
        </div>

        <figure className="hero-demo">
          <BeforeAfterSlider
            idealUrl={EXEMPLO_IDEAL_URL}
            finalUrl={EXEMPLO_FINAL_URL}
            proporcao={EXEMPLO_W / EXEMPLO_H}
            caixas={caixasHero}
            mostrarCaixas
          />
          <figcaption className="caption">
            Arraste o divisor para comparar o prato servido com o devolvido. A caixa tracejada é um osso: o modelo o
            reconhece com pouca confiança, e ele quase não conta como sobra.
          </figcaption>
        </figure>
      </div>

      <div className="container">
        <ul className="hero-classes" aria-label="Os 12 alimentos que o modelo reconhece">
          <li className="hero-classes-rotulo" aria-hidden="true">
            O modelo reconhece
          </li>
          {CLASSES_POR_ROTULO.map((c) => (
            <li key={c}>
              <ClassPill>{ROTULOS[c]}</ClassPill>
            </li>
          ))}
        </ul>

        <div id="como-funciona" className="como">
          <h2 className="secao-subtitulo">Como funciona</h2>
          <ol className="passos">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="passo">
                <span className="passo-num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="card-title">{p.titulo}</h3>
                <p className="muted">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
