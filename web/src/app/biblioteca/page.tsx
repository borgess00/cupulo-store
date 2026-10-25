import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, KeyRound, RefreshCw } from "lucide-react";
import { AccessBadge } from "@/components/access-badge";
import { ProductCover } from "@/components/brand/product-cover";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { listUserAccesses } from "@/lib/access";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Minha biblioteca", robots: { index: false } };

async function Library() {
  const user = await requireUser("/biblioteca");
  const accesses = await listUserAccesses(user.id);

  if (accesses.length === 0) {
    return (
      <div className="card-grunge flex flex-col items-center px-6 py-14 text-center">
        <KeyRound className="h-10 w-10 text-ash" />
        <p className="mt-4 font-display text-3xl">Sua biblioteca está vazia</p>
        <p className="mt-2 max-w-sm text-ash">Resgate a key que você recebeu no Discord para liberar seu primeiro pack.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/resgatar" size="lg">Resgatar key</ButtonLink>
          <a href={site.discordInvite} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "lg")}>
            Comprar no Discord
          </a>
        </div>
      </div>
    );
  }

  const ativos = accesses.filter((a) => a.status !== "expired").length;

  return (
    <>
      <p className="mb-5 text-sm text-ash">
        {ativos} {ativos === 1 ? "produto ativo" : "produtos ativos"} · {accesses.length - ativos} expirado(s)
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        {accesses.map((a) => {
          const expired = a.status === "expired";
          return (
            <li key={a.id} className={`card-grunge glitch-hover flex overflow-hidden ${expired ? "opacity-70" : ""}`}>
              <Link href={`/produto/${a.product.slug}`} className="hidden w-40 shrink-0 border-r border-line sm:block" tabIndex={-1} aria-hidden="true">
                <ProductCover product={a.product} className="h-full !aspect-auto" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-2xl leading-none">{a.product.name}</h2>
                  <AccessBadge status={a.status} />
                </div>
                <div className="text-sm">
                  {a.status === "lifetime" ? (
                    <p className="text-ash">Acesso para sempre.</p>
                  ) : expired ? (
                    <p className="text-ash">Expirou em {a.expiresAt ? formatDateTime(a.expiresAt) : "—"}.</p>
                  ) : (
                    <>
                      <p className="text-xs uppercase tracking-[0.2em] text-smoke">Tempo restante</p>
                      <Countdown expiresAt={a.expiresAt!.toISOString()} className="font-display text-3xl tabular-nums" />
                      <p className="text-xs text-smoke">até {formatDateTime(a.expiresAt!)}</p>
                    </>
                  )}
                </div>
                <div className="mt-auto flex flex-wrap gap-2">
                  {expired ? (
                    <a href={site.discordInvite} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "sm")}>
                      <RefreshCw className="h-4 w-4" /> Renovar no Discord
                    </a>
                  ) : (
                    <ButtonLink href={`/produto/${a.product.slug}`} size="sm">
                      Acessar <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function BibliotecaPage() {
  return (
    <>
      <PageHeader kicker="Área do cliente" title="Minha biblioteca" brush="seus packs liberados">
        <ButtonLink href="/resgatar" variant="outline" size="sm">
          <KeyRound className="h-4 w-4" /> Resgatar outra key
        </ButtonLink>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Suspense
          fallback={
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-44" />
              <Skeleton className="h-44" />
            </div>
          }
        >
          <Library />
        </Suspense>
      </div>
    </>
  );
}
