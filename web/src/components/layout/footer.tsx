import Link from "next/link";
import { Barcode } from "@/components/brand/barcode";
import { Logo } from "@/components/brand/logo";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-line bg-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 halftone-fade opacity-[0.07]" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm text-ash">
            Packs, sensibilidades e otimizações para Free Fire. <span className="font-brush text-paper">{site.slogan}.</span>
          </p>
          <Barcode value="CUPULO-STORE" className="w-44 text-paper/70" />
        </div>
        <nav aria-label="Rodapé" className="grid content-start gap-2 text-sm">
          <p className="mb-1 font-display text-lg">Navegação</p>
          <Link href="/" className="text-ash hover:text-paper">Início</Link>
          <Link href="/#produtos" className="text-ash hover:text-paper">Produtos</Link>
          <Link href="/#como-funciona" className="text-ash hover:text-paper">Como funciona</Link>
          <Link href="/#faq" className="text-ash hover:text-paper">FAQ</Link>
          <Link href="/termos" className="text-ash hover:text-paper">Termos e privacidade</Link>
        </nav>
        <div className="grid content-start gap-2 text-sm">
          <p className="mb-1 font-display text-lg">Área do cliente</p>
          <Link href="/biblioteca" className="text-ash hover:text-paper">Minha biblioteca</Link>
          <Link href="/resgatar" className="text-ash hover:text-paper">Resgatar key</Link>
          <a href={site.discordInvite} target="_blank" rel="noopener noreferrer" className="text-ash hover:text-paper">
            Servidor do Discord ↗
          </a>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-[0.7rem] uppercase tracking-[0.25em] text-smoke sm:px-6">
          CUPULO STORE · Gaming · Performance · Free Fire — não afiliada à Garena.
        </p>
      </div>
    </footer>
  );
}
