import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BookOpen, Download, KeyRound, ShieldCheck, Smartphone, Zap } from "lucide-react";
import { devSignIn, signInWithDiscord } from "@/app/actions/auth";
import { Barcode } from "@/components/brand/barcode";
import { Splatter } from "@/components/brand/splatter";
import { buttonClasses } from "@/components/ui/button";
import { DiscordIcon } from "@/components/ui/icons";
import { devLoginEnabled } from "@/lib/env";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Entrar",
  robots: { index: false },
};

const ERROS: Record<string, string> = {
  banido: "Sua conta está bloqueada. Fale com a staff no Discord.",
  AccessDenied: "O login foi cancelado ou negado. Tente de novo.",
  OAuthCallbackError: "O Discord não confirmou o login. Tente de novo.",
  OAuthSignin: "Não foi possível iniciar o login com o Discord.",
  Configuration: "Login temporariamente indisponível. Avise a staff.",
};

const BENEFICIOS = [
  { icon: Zap, title: "Packs exclusivos", text: "Sensibilidades e configurações prontas para o seu aparelho." },
  { icon: BookOpen, title: "Tutoriais e vídeos", text: "Passo a passo de cada pack liberado na sua conta." },
  { icon: ShieldCheck, title: "Compra no Discord", text: "Compre no servidor, receba a key e resgate aqui." },
  { icon: Smartphone, title: "No celular ou PC", text: "Acesse sua biblioteca de qualquer lugar." },
];

async function LoginActions({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const callbackUrl = safeRedirectPath(typeof sp.callbackUrl === "string" ? sp.callbackUrl : undefined);
  const codigo = typeof sp.erro === "string" ? sp.erro : typeof sp.error === "string" ? sp.error : undefined;
  const erro = codigo ? (ERROS[codigo] ?? "Não foi possível entrar. Tente de novo.") : null;

  return (
    <div className="space-y-4">
      {erro && (
        <p role="alert" className="rounded-md border border-danger/50 bg-danger/10 px-4 py-3 text-sm text-danger">
          {erro}
        </p>
      )}
      <form action={signInWithDiscord}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <button type="submit" className={buttonClasses("primary", "lg", "w-full")}>
          <DiscordIcon className="h-6 w-6" /> Entrar com Discord
        </button>
      </form>
      {devLoginEnabled() && (
        <form action={devSignIn} className="space-y-2 rounded-md border border-dashed border-line-strong p-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-ash">Login de teste (só em dev)</p>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div className="flex gap-2">
            <input name="discordId" placeholder="ID do Discord" defaultValue="100000000000000001" className="w-1/2 rounded border border-line bg-ink px-2 py-1.5 text-sm" />
            <input name="name" placeholder="Nome" defaultValue="Dev" className="w-1/2 rounded border border-line bg-ink px-2 py-1.5 text-sm" />
          </div>
          <button type="submit" className={buttonClasses("outline", "sm", "w-full")}>
            Entrar como teste
          </button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <div className="relative overflow-hidden">
      <Splatter seed="login-a" className="absolute -left-24 top-10 h-80 w-80 text-white/[0.06]" />
      <Splatter seed="login-b" className="absolute -right-20 bottom-0 h-96 w-96 text-white/[0.05]" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 halftone-fade opacity-20" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[1fr_minmax(0,28rem)_1fr]">
        {/* Manifesto */}
        <div aria-hidden="true" className="hidden select-none lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-smoke">Sensibilidade</p>
          <p className="font-display text-6xl text-paper/80 text-worn">É o nosso</p>
          <p className="font-display text-[7rem] leading-none text-paper text-worn">Jogo</p>
          <Barcode value="CPL-0001-SENSI" className="mt-6 w-48 text-paper/60" />
        </div>

        {/* Painel */}
        <section aria-labelledby="login-titulo" className="card-grunge relative px-5 py-8 sm:px-8">
          <span className="tape absolute -top-3 left-8 h-6 w-24 -rotate-3" aria-hidden="true" />
          <p className="inline-flex items-center gap-2 rounded-sm border border-line px-2 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-ash">
            <ShieldCheck className="h-3.5 w-3.5" /> Acesso à sua conta
          </p>
          <h1 id="login-titulo" className="mt-5 font-display text-5xl text-worn sm:text-6xl">
            Seu jogo.
            <span className="mt-1 block font-brush text-3xl normal-case text-ash sm:text-4xl">seu próximo nível.</span>
          </h1>
          <p className="mt-5 text-ash">
            Entre com a sua conta do Discord para resgatar sua key e acessar seus packs.
          </p>

          <div className="mt-7">
            <Suspense fallback={<div className={buttonClasses("primary", "lg", "w-full opacity-60")}>Carregando…</div>}>
              <LoginActions searchParams={props.searchParams} />
            </Suspense>
          </div>

          <p className="mt-4 text-xs text-smoke">
            Primeira vez aqui? Sua conta é criada automaticamente ao entrar com o Discord. Ao entrar, você concorda com os{" "}
            <Link href="/termos" className="underline underline-offset-2 hover:text-paper">
              Termos de Uso e a Política de Privacidade
            </Link>
            .
          </p>

          <ol className="mt-7 grid grid-cols-3 gap-2 border-t border-line pt-5 text-center text-[0.7rem] font-semibold uppercase tracking-wider text-ash">
            {[
              { n: "01", t: "Entre com Discord", i: DiscordIcon },
              { n: "02", t: "Resgate sua key", i: KeyRound },
              { n: "03", t: "Baixe seus packs", i: Download },
            ].map(({ n, t, i: Icon }) => (
              <li key={n} className="flex flex-col items-center gap-1.5">
                <Icon className="h-5 w-5 text-paper" />
                <span className="font-display text-lg text-paper">{n}</span>
                {t}
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-ash sm:flex-row sm:justify-between">
            <span>
              Ainda não tem key?{" "}
              <a href={site.discordInvite} target="_blank" rel="noopener noreferrer" className="font-semibold text-paper underline underline-offset-2">
                Comprar no Discord ↗
              </a>
            </span>
          </div>
        </section>

        {/* Benefícios */}
        <aside className="space-y-5">
          <p className="font-display text-3xl leading-none">
            Faça parte da <span className="block text-5xl text-worn">Cupulo</span>
          </p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {BENEFICIOS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3 rounded-md border border-line p-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded border border-line-strong">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-display text-lg">{title}</span>
                  <span className="text-sm text-ash">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
