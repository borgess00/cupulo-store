import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, Calculator, FileDown, History, KeyRound, Lock, PlayCircle, ScrollText } from "lucide-react";
import Link from "next/link";
import { AccessBadge } from "@/components/access-badge";
import { ProductCover } from "@/components/brand/product-cover";
import { DownloadButton } from "@/components/download-button";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { Countdown } from "@/components/ui/countdown";
import { Markdown } from "@/components/ui/markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { YouTubeEmbed } from "@/components/ui/youtube";
import { accessStatus } from "@/lib/access-math";
import { db } from "@/lib/db";
import { formatBytes, formatDate, formatDateTime, PLATFORM_LABEL } from "@/lib/format";
import { getProductPage } from "@/lib/products";
import { requireUser } from "@/lib/session";
import { SENSI_PRODUCT_SLUG, site } from "@/lib/site";
import { youtubeId } from "@/lib/youtube";

export const metadata: Metadata = { title: "Produto", robots: { index: false } };

function SectionHeading({ icon: Icon, children }: { icon: typeof FileDown; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-display text-3xl">
      <Icon className="h-6 w-6 text-ash" /> {children}
    </h2>
  );
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireUser(`/produto/${slug}`);
  const product = await getProductPage(slug);
  if (!product) notFound();

  const access = await db.access.findUnique({
    where: { userId_productId: { userId: user.id, productId: product.id } },
  });
  const status = access ? accessStatus(access) : "expired";
  const unlocked = status !== "expired";
  // Produto desativado só aparece para quem já tem acesso.
  if (!product.active && !unlocked) notFound();

  const video = youtubeId(product.youtubeUrl);

  return (
    <>
      <div className="relative border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,22rem)_1fr] md:py-12">
          <ProductCover product={product} priority className="rounded-[var(--radius-card)] border border-line" />
          <div className="flex flex-col justify-center">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ash">
              {product.category} · {PLATFORM_LABEL[product.platform]}
            </p>
            <h1 className="mt-2 font-display text-5xl text-worn sm:text-6xl">{product.name}</h1>
            <Markdown className="mt-3 max-w-xl">{product.description}</Markdown>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {access && <AccessBadge status={status} />}
              {status === "active" && access?.expiresAt && (
                <p className="text-sm text-ash">
                  Restam <Countdown expiresAt={access.expiresAt.toISOString()} className="font-display text-xl text-paper tabular-nums" />
                  <span className="ml-1 text-xs text-smoke">(até {formatDateTime(access.expiresAt)})</span>
                </p>
              )}
              {status === "lifetime" && <p className="text-sm text-ash">Acesso vitalício.</p>}
            </div>
          </div>
        </div>
      </div>

      {!unlocked ? (
        <div className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6">
          <Lock className="mx-auto h-10 w-10 text-ash" />
          <p className="mt-4 font-display text-4xl">
            {access ? "Seu acesso expirou" : "Produto bloqueado"}
          </p>
          <p className="mt-2 text-ash">
            {access?.expiresAt
              ? `Seu acesso terminou em ${formatDateTime(access.expiresAt)}. Compre uma nova key no Discord para renovar: o tempo começa a contar do resgate.`
              : "Você ainda não tem acesso a este produto. Compre no nosso Discord e resgate a key para liberar."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink href="/resgatar" size="lg">
              <KeyRound className="h-5 w-5" /> Já tenho uma key
            </ButtonLink>
            <a href={site.discordInvite} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "lg")}>
              Comprar no Discord
            </a>
          </div>
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-12">
            {product.type === "TOOL" && product.slug === SENSI_PRODUCT_SLUG && (
              <div className="card-grunge flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-3xl">Gerador de Sensi</p>
                  <p className="text-sm text-ash">Calcule a sensibilidade ideal para o seu iPhone.</p>
                </div>
                <ButtonLink href="/gerador-sensi" size="lg">
                  <Calculator className="h-5 w-5" /> Abrir gerador
                </ButtonLink>
              </div>
            )}

            {video && (
              <section>
                <SectionHeading icon={PlayCircle}>Vídeo</SectionHeading>
                <YouTubeEmbed id={video} title={product.name} />
              </section>
            )}

            {product.tutorialMd && (
              <section>
                <SectionHeading icon={ScrollText}>Tutorial</SectionHeading>
                <Markdown>{product.tutorialMd}</Markdown>
              </section>
            )}
          </div>

          <aside className="space-y-10">
            {product.type !== "TOOL" || product.files.length > 0 ? (
              <section id="downloads">
                <SectionHeading icon={FileDown}>Downloads</SectionHeading>
                {product.files.length === 0 ? (
                  <p className="text-sm text-ash">Os arquivos deste pack ainda estão sendo preparados. Volte em breve.</p>
                ) : (
                  <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line">
                    {product.files.map((f) => (
                      <li key={f.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" title={f.name}>{f.name}</p>
                          <p className="text-xs text-smoke">
                            {formatBytes(f.sizeBytes)}
                            {f.version && ` · v${f.version}`} · {formatDate(f.createdAt)}
                          </p>
                        </div>
                        <DownloadButton fileId={f.id} />
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-smoke">Cada link de download vale por 5 minutos.</p>
              </section>
            ) : null}

            {product.changelog.length > 0 && (
              <section>
                <SectionHeading icon={History}>Changelog</SectionHeading>
                <ol className="space-y-5 border-l border-line pl-4">
                  {product.changelog.map((c) => (
                    <li key={c.id} className="relative">
                      <span className="absolute -left-[1.32rem] top-1.5 h-2.5 w-2.5 rounded-full bg-paper" />
                      <p className="font-display text-xl">v{c.version}</p>
                      <p className="text-xs text-smoke">{formatDate(c.publishedAt)}</p>
                      <Markdown className="mt-1 text-sm">{c.notes}</Markdown>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

export default function ProdutoPage(props: PageProps<"/produto/[slug]">) {
  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <Link href="/biblioteca" className="inline-flex items-center gap-1 text-sm text-ash hover:text-paper">
          <ArrowLeft className="h-4 w-4" /> Minha biblioteca
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[22rem_1fr]">
            <Skeleton className="aspect-[16/10]" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-14 w-3/4" />
              <Skeleton className="h-20" />
            </div>
          </div>
        }
      >
        <ProductContent params={props.params} />
      </Suspense>
    </>
  );
}
