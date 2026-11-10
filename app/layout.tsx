import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Header } from "@/components/Header";
import "./globals.css";
import "./components.css";
import "./charts.css";
import "./pages.css";

/** Uma família só, geométrica, como no painel de referência: títulos em 600 com tracking apertado. */
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Prato Limpo · RU UFMA", template: "%s · Prato Limpo" },
  description:
    "Desperdício alimentar no Restaurante Universitário da UFMA medido por visão computacional. Iniciação Científica do VisionLab.",
  icons: { icon: "/icon.svg" },
};

/** O site é sempre claro, mesmo com o sistema no modo escuro. */
export const viewport: Viewport = {
  themeColor: "#F4F7F9",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={sans.variable}
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
              <span>Dataset sob licença CC BY 4.0</span>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
