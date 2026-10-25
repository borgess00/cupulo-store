import Link from "next/link";
import { Suspense } from "react";
import { RedemptionsChart } from "@/components/admin/redemptions-chart";
import { AdminTitle, Panel, StatTile } from "@/components/admin/ui";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardStats } from "@/lib/admin-stats";
import { DURATIONS } from "@/lib/durations";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Dashboard" };

async function Dashboard() {
  await requireAdmin();
  const s = await getDashboardStats();
  const max = Math.max(1, ...s.byProduct.map((p) => p.count));
  const last30 = s.daily.reduce((a, d) => a + d.redemptions, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile label="Usuários" value={s.users} />
        <StatTile label="Keys geradas" value={s.keysTotal} />
        <StatTile label="Resgatadas" value={s.keysRedeemed} />
        <StatTile label="Disponíveis" value={s.keysAvailable} hint={s.keysRevoked ? `${s.keysRevoked} revogadas` : undefined} />
        <StatTile label="Acessos ativos" value={s.activeAccesses} />
        <StatTile label="Downloads" value={s.downloads30} hint="últimos 30 dias" />
      </div>

      <Panel title="Resgates por dia" actions={<span className="text-sm text-ash">{last30} nos últimos 30 dias</span>}>
        <RedemptionsChart data={s.daily} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Resgates por produto">
          <ul className="space-y-3">
            {s.byProduct.map((p) => (
              <li key={p.name}>
                <div className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-display text-lg tabular-nums">{p.count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-paper" style={{ width: `${(p.count / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Últimos resgates" actions={<ButtonLink href="/admin/keys?status=REDEEMED" variant="ghost" size="sm">Ver todos</ButtonLink>}>
          {s.recent.length === 0 ? (
            <p className="text-sm text-ash">Nenhum resgate ainda.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {s.recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/admin/usuarios/${r.user.id}`} className="font-semibold hover:underline">
                      {r.user.globalName ?? r.user.username}
                    </Link>
                    <p className="truncate text-xs text-ash">
                      {r.product.name} · {DURATIONS[r.key.duration].label}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-smoke">{formatDateTime(r.redeemedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default function AdminHome() {
  return (
    <>
      <AdminTitle title="Dashboard">
        <ButtonLink href="/admin/keys" size="sm">Gerar keys</ButtonLink>
      </AdminTitle>
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <Skeleton className="h-80" />
          </div>
        }
      >
        <Dashboard />
      </Suspense>
    </>
  );
}
