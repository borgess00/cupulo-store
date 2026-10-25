import type { Metadata } from "next";
import { Suspense } from "react";
import { Lock } from "lucide-react";
import { SensiForm } from "@/components/sensi-form";
import { buttonClasses, ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessProduct } from "@/lib/access";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { SENSI_PRODUCT_SLUG, site } from "@/lib/site";

export const metadata: Metadata = { title: "Gerador de Sensi iOS", robots: { index: false } };

async function Gate() {
  const user = await requireUser("/gerador-sensi");
  const product = await db.product.findUnique({ where: { slug: SENSI_PRODUCT_SLUG }, select: { id: true } });
  const liberado = !!product && (await canAccessProduct(user, product.id));

  if (!liberado) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <Lock className="mx-auto h-10 w-10 text-ash" />
        <p className="mt-4 font-display text-4xl">Ferramenta bloqueada</p>
        <p className="mt-2 text-ash">
          O Gerador de Sensi iOS é liberado com a key do produto. Compre no Discord e resgate para usar.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/resgatar" size="lg">Já tenho uma key</ButtonLink>
          <a href={site.discordInvite} target="_blank" rel="noopener noreferrer" className={buttonClasses("outline", "lg")}>
            Comprar no Discord
          </a>
        </div>
      </div>
    );
  }
  return <SensiForm />;
}

export default function GeradorSensiPage() {
  return (
    <>
      <PageHeader kicker="Ferramenta" title="Gerador de Sensi iOS" brush="sensi sob medida pro seu iPhone" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Suspense fallback={<Skeleton className="h-[32rem]" />}>
          <Gate />
        </Suspense>
      </div>
    </>
  );
}
