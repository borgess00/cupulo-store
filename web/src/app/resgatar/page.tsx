import type { Metadata } from "next";
import { Suspense } from "react";
import { RedeemForm } from "@/components/redeem-form";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Resgatar key", robots: { index: false } };

export default function ResgatarPage() {
  return (
    <>
      <PageHeader kicker="Área do cliente" title="Resgatar key" brush="libere seu produto" />
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_20rem]">
        <Suspense fallback={<Skeleton className="h-72" />}>
          <RedeemForm />
        </Suspense>
        <aside className="space-y-4 text-sm text-ash">
          <h2 className="font-display text-2xl text-paper">Como funciona</h2>
          <ol className="space-y-3">
            <li><b className="font-display text-lg text-paper">01</b> Compre no nosso Discord e receba a key na DM.</li>
            <li><b className="font-display text-lg text-paper">02</b> Cole a key aqui. Ela vale uma única vez e fica presa à sua conta.</li>
            <li><b className="font-display text-lg text-paper">03</b> O produto aparece na sua biblioteca na hora. Se já tiver acesso, o tempo soma.</li>
          </ol>
          <p>
            Problemas com a key?{" "}
            <a href={site.discordInvite} target="_blank" rel="noopener noreferrer" className="font-semibold text-paper underline underline-offset-2">
              Abra um ticket no Discord ↗
            </a>
          </p>
        </aside>
      </div>
    </>
  );
}
