import type { Metadata } from "next";
import { DevDemo } from "./DevDemo";

export const metadata: Metadata = { title: "Componentes", robots: { index: false } };

export default function ComponentesPage() {
  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <p className="overline">Desenvolvimento</p>
          <h1 className="page-title">Componentes</h1>
          <p className="caption">Catálogo dos componentes do Prato Limpo, em uso real.</p>
        </div>
      </div>
      <DevDemo />
    </div>
  );
}
