import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { Header } from "@/components/Header";
import "./globals.css";
import "./components.css";
import "./charts.css";
import "./pages.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", variable: "--font-serif", display: "swap" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Prato Limpo · RU UFMA", template: "%s · Prato Limpo" },
  description:
    "Desperdício alimentar no Restaurante Universitário da UFMA medido por visão computacional. Iniciação Científica do VisionLab.",
  icons: { icon: "/icon.svg" },
};

/** O site é sempre claro, mesmo com o sistema no modo escuro. */
export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo">{children}</main>
        <footer className="site-footer">
          <div className="container site-footer-inner caption">
            <span>Prato Limpo, um projeto do VisionLab na Universidade Federal do Maranhão.</span>
            <span className="footer-links">
              <Link href="/#como-funciona">Como funciona</Link>
              <Link href="/#modelo">O modelo</Link>
              <span>Dataset sob licença CC BY 4.0</span>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
