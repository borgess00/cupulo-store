import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { buttonClasses } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { isAccessActive } from "@/lib/access-math";
import { db } from "@/lib/db";
import { discordAvatarUrl } from "@/lib/discord";
import { DURATIONS } from "@/lib/durations";
import { formatDate, formatDateTime } from "@/lib/format";
import { maskKey } from "@/lib/keys";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Perfil", robots: { index: false } };

async function Profile() {
  const user = await requireUser("/perfil");
  const [redemptions, accesses, downloads] = await Promise.all([
    db.redemption.findMany({
      where: { userId: user.id },
      orderBy: { redeemedAt: "desc" },
      include: { product: { select: { name: true } }, key: { select: { last4: true, duration: true, status: true } } },
    }),
    db.access.findMany({ where: { userId: user.id }, select: { expiresAt: true, lifetime: true } }),
    db.downloadLog.count({ where: { userId: user.id } }),
  ]);
  const ativos = accesses.filter((a) => isAccessActive(a)).length;

  return (
    <div className="grid gap-10 lg:grid-cols-[20rem_1fr]">
      <aside className="card-grunge h-fit p-6 text-center">
        <Image
          src={discordAvatarUrl(user.discordId, user.avatar, 256)}
          alt=""
          width={112}
          height={112}
          unoptimized
          className="mx-auto rounded-full ring-2 ring-white/20"
        />
        <p className="mt-4 font-display text-3xl">{user.globalName ?? user.username}</p>
        <p className="text-sm text-ash">@{user.username}</p>
        <p className="mt-1 font-mono text-xs text-smoke">ID {user.discordId}</p>
        <dl className="mt-6 grid grid-cols-3 gap-2 border-y border-line py-4">
          {[
            ["Ativos", ativos],
            ["Keys", redemptions.length],
            ["Downloads", downloads],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-smoke">{label}</dt>
              <dd className="font-display text-2xl">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-smoke">Cliente desde {formatDate(user.createdAt)}</p>
        <form action={signOutAction} className="mt-5">
          <button type="submit" className={buttonClasses("outline", "sm", "w-full")}>
            <LogOut className="h-4 w-4" /> Sair da conta
          </button>
        </form>
      </aside>

      <section>
        <h2 className="mb-4 font-display text-3xl">Keys resgatadas</h2>
        {redemptions.length === 0 ? (
          <p className="text-ash">Você ainda não resgatou nenhuma key.</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-white/[0.03] text-[0.7rem] uppercase tracking-[0.18em] text-smoke">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Key</th>
                  <th className="px-4 py-3 font-semibold">Duração</th>
                  <th className="px-4 py-3 font-semibold">Resgatada em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {redemptions.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-3 font-semibold">{r.product.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ash">
                      {maskKey(r.key.last4)}
                      {r.key.status === "REVOKED" && <Badge tone="danger" className="ml-2">Revogada</Badge>}
                    </td>
                    <td className="px-4 py-3">{DURATIONS[r.key.duration].label}</td>
                    <td className="px-4 py-3 text-ash">{formatDateTime(r.redeemedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function PerfilPage() {
  return (
    <>
      <PageHeader kicker="Área do cliente" title="Meu perfil" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Suspense fallback={<Skeleton className="h-96" />}>
          <Profile />
        </Suspense>
      </div>
    </>
  );
}
