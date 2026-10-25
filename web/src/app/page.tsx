import Image from "next/image";
import { ArrowRight, Download, KeyRound, ShoppingCart, Ticket } from "lucide-react";
import { Barcode } from "@/components/brand/barcode";
import { SectionTitle } from "@/components/brand/section-title";
import { Splatter } from "@/components/brand/splatter";
import { ProductCard } from "@/components/product-card";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { DiscordIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/ui/reveal";
import { getStoreProducts } from "@/lib/products";
import { site } from "@/lib/site";

const PASSOS = [
  { n: "01", icon: ShoppingCart, title: "Compre no Discord", text: "Escolha seu pack no nosso servidor e faça o pagamento com a staff." },
  { n: "02", icon: Ticket, title: "Receba sua key", text: "O bot te manda a key na DM na hora: CUPULO-XXXX-XXXX-XXXX." },
  { n: "03", icon: KeyRound, title: "Resgate no site", text: "Entre com o Discord, cole a key e o produto é liberado na sua conta." },
  { n: "04", icon: Download, title: "Baixe seu pack", text: "Acesse a biblioteca, siga o tutorial e baixe os arquivos." },
];

const FAQ = [
  {
    q: "Como eu compro?",
    a: "Toda compra é feita no nosso servidor do Discord. Depois do pagamento, você recebe uma key na DM para resgatar aqui no site.",
  },
  {
    q: "Recebi minha key. E agora?",
    a: "Clique em Entrar com Discord, vá em Resgatar Key e cole o código. O produto aparece na hora na sua biblioteca.",
  },
  {
    q: "Quanto tempo dura o acesso?",
    a: "Depende do plano: 7 dias, 30 dias ou vitalício. O tempo restante aparece na sua biblioteca. Se resgatar outra key do mesmo produto, o tempo soma.",
  },
  {
    q: "Posso usar a key em outra conta?",
    a: "Não. Cada key só pode ser resgatada uma vez e fica vinculada à conta do Discord que resgatou.",
  },
  {
    q: "Funciona no celular?",
    a: "Sim. O site foi feito pensando no celular: você resgata, assiste aos tutoriais e baixa os arquivos direto pelo navegador.",
  },
  {
    q: "Tive um problema. Com quem falo?",
    a: "Abra um ticket no nosso servidor do Discord que a staff te ajuda.",
  },
];

const FAIXA = ["Sensibilidade", "Packs", "Free Fire", "Capa", "Performance", "Mira", "Cupulo Store"];

async function Vitrine() {
  const products = await getStoreProducts();
  return (
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={Math.min(i, 5) * 0.05}>
          <ProductCard product={p} />
        </Reveal>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <Splatter seed="hero-1" className="absolute -left-28 -top-20 h-[26rem] w-[26rem] text-white/[0.05]" />
        <Splatter seed="hero-2" className="absolute -right-24 bottom-0 h-80 w-80 text-white/[0.04]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 halftone-fade opacity-[0.12]" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pb-24 md:pt-16">
          <div className="order-2 md:order-1">
            <p className="inline-flex items-center gap-2 rounded-sm border border-line px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ash">
              Free Fire · Sensibilidade · Performance
            </p>
            <h1 className="relative mt-5">
              <span className="block font-display text-[5.2rem] leading-[0.82] text-paper text-worn sm:text-[7.5rem] lg:text-[9rem]">
                Cupulo
              </span>
              <span className="absolute -bottom-6 right-2 -rotate-6 font-brush text-5xl text-paper drop-shadow-[0_2px_0_#0a0a0a] sm:right-10 sm:text-6xl md:-right-2 lg:text-7xl">
                store
              </span>
            </h1>
            <p className="mt-12 max-w-md text-lg text-ash">
              Packs de sensibilidade, otimizações e ferramentas para você subir de nível.{" "}
              <span className="font-brush text-paper">{site.slogan}.</span>
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/login" size="lg">
                <DiscordIcon className="h-6 w-6" /> Entrar com Discord
              </ButtonLink>
              <a href={site.discordInvite} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "lg")}>
                Comprar no Discord <ArrowRight className="h-5 w-5" />
              </a>
            </div>
            <Barcode value="CUPULO-STORE-2026" className="mt-10 hidden w-56 text-paper/50 sm:inline-flex" />
          </div>

          <div className="relative order-1 mx-auto w-full max-w-[19rem] sm:max-w-sm md:order-2 md:max-w-none">
            <div className="relative rotate-2 transition duration-500 hover:rotate-0">
              <span className="tape absolute -top-4 left-1/2 z-10 h-7 w-28 -translate-x-1/2 -rotate-2" aria-hidden="true" />
              <Image
                src="/logo.png"
                alt="Logo da CUPULO STORE"
                width={512}
                height={512}
                priority
                sizes="(max-width: 768px) 80vw, 40vw"
                className="h-auto w-full rounded-[18%] border border-line-strong shadow-[10px_10px_0_0_rgb(255_255_255/0.08)]"
              />
            </div>
            <p className="absolute -bottom-3 -left-2 -rotate-6 bg-paper px-2 py-0.5 font-display text-sm tracking-widest text-ink sm:-left-6">
              Prime
            </p>
          </div>
        </div>
      </section>

      {/* FAIXA */}
      <div className="-rotate-1 border-y border-ink bg-paper py-3 text-ink" aria-hidden="true">
        <div className="overflow-hidden">
          <div className="flex w-max animate-marquee">
            {[0, 1].map((k) => (
              <div key={k} className="flex shrink-0 items-center">
                {FAIXA.map((t) => (
                  <span key={t + k} className="flex items-center font-display text-2xl tracking-wide">
                    <span className="px-5">{t}</span>
                    <span className="text-lg">✕</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PRODUTOS */}
      <section id="produtos" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-24 sm:px-6">
        <SectionTitle kicker="Vitrine" title="Nossos packs" brush="escolha o seu" />
        <Vitrine />
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 pt-28 sm:px-6">
        <SectionTitle kicker="Passo a passo" title="Como funciona" brush="simples assim" />
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PASSOS.map(({ n, icon: Icon, title, text }, i) => (
            <Reveal key={n} delay={i * 0.08}>
              <li className="card-grunge relative h-full overflow-hidden p-5">
                <span className="pointer-events-none absolute -right-2 -top-6 font-display text-[6.5rem] leading-none text-white/[0.06]">
                  {n}
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded border border-line-strong">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-2xl">{title}</h3>
                <p className="mt-1 text-sm text-ash">{text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-4 pt-28 sm:px-6">
        <SectionTitle kicker="Dúvidas" title="Perguntas frequentes" />
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group py-1">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-xl [&::-webkit-details-marker]:hidden">
                {q}
                <span className="text-2xl text-ash transition group-open:rotate-45">+</span>
              </summary>
              <p className="pb-5 text-ash">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA DISCORD */}
      <section className="mx-auto max-w-6xl px-4 pt-28 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-paper px-6 py-12 text-ink sm:px-12">
            <Splatter seed="cta" className="absolute -right-10 -top-10 h-72 w-72 text-ink/10" />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div>
                <p className="font-display text-5xl leading-[0.9] sm:text-6xl">Entre no nosso Discord</p>
                <p className="mt-2 -rotate-1 font-brush text-2xl text-ink/70">compre, tire dúvidas e receba suporte</p>
              </div>
              <a
                href={site.discordInvite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center gap-2 rounded-md bg-ink px-7 font-display text-xl text-paper transition hover:bg-black"
              >
                <DiscordIcon className="h-6 w-6" /> Entrar no servidor
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
