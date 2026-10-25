import type { Metadata, Viewport } from "next";
import "@fontsource/anton/400.css";
import "@fontsource/permanent-marker/400.css";
import "@fontsource-variable/inter/index.css";
import "./globals.css";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.slogan}`, template: `%s · ${site.name}` },
  description: "Packs de sensibilidade, otimizações e ferramentas para Free Fire. Compre no Discord e resgate sua key no site.",
  openGraph: { siteName: site.name, locale: "pt_BR", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded focus:bg-paper focus:px-3 focus:py-2 focus:text-ink"
        >
          Pular para o conteúdo
        </a>
        <Header />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
