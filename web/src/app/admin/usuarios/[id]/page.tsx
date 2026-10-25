import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessBadge } from "@/components/access-badge";
import { BanButton, GrantAccessForm, RemoveAccessButton } from "@/components/admin/user-controls";
import { AdminTitle, Panel, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { accessStatus } from "@/lib/access-math";
import { db } from "@/lib/db";
import { discordAvatarUrl } from "@/lib/discord";
import { DURATIONS } from "@/lib/durations";
import { formatDateTime } from "@/lib/format";
import { maskKey } from "@/lib/keys";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Usuário" };

async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const user = await db.user.findUnique({
    where: { id },
    include: {
      accesses: { include: { product: { select: { id: true, name: true } } }, orderBy: { updatedAt: "desc" } },
      redemptions: {
        orderBy: { redeemedAt: "desc" },
        include: { product: { select: { name: true } }, key: { select: { last4: true, duration: true, status: true } } },
      },
      downloads: { orderBy: { createdAt: "desc" }, take: 20, include: { file: { select: { name: true } }, product: { select: { name: true } } } },
    },
  });
  if (!user) notFound();
  const products = await db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  const accesses = user.accesses.filter((a) => a.lifetime || a.expiresAt);

  return (
    <>
      <AdminTitle title={user.globalName ?? user.username}>
        <BanButton userId={user.id} banned={user.banned} />
      </AdminTitle>
      <div className="mb-6 flex items-center gap-4">
        <Image src={discordAvatarUrl(user.discordId, user.avatar, 128)} alt="" width={64} height={64} unoptimized className="rounded-full" />
        <div className="text-sm">
          <p>@{user.username} {user.banned && <Badge tone="danger">Bloqueado</Badge>}</p>
          <p className="font-mono text-xs text-ash">ID {user.discordId}</p>
          <p className="text-xs text-smoke">Desde {formatDateTime(user.createdAt)} · último login {formatDateTime(user.lastLoginAt)}</p>
        </div>
      </div>

      <div className="space-y-6">
        <Panel title="Acessos">
          {accesses.length === 0 ? (
            <p className="mb-4 text-sm text-ash">Nenhum acesso.</p>
          ) : (
            <div className="mb-5">
              <Table minWidth="36rem">
                <thead><tr><Th>Produto</Th><Th>Status</Th><Th>Até</Th><Th /></tr></thead>
                <tbody>
                  {accesses.map((a) => (
                    <tr key={a.id}>
                      <Td className="font-semibold">{a.product.name}</Td>
                      <Td>
                        <AccessBadge status={accessStatus(a)} />
                        {a.manualLifetime && <span className="ml-2 text-xs text-smoke">manual</span>}
                      </Td>
                      <Td className="text-xs text-ash">{a.lifetime ? "—" : a.expiresAt ? formatDateTime(a.expiresAt) : "—"}</Td>
                      <Td className="text-right"><RemoveAccessButton userId={user.id} productId={a.product.id} name={a.product.name} /></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
          <GrantAccessForm userId={user.id} products={products} />
        </Panel>

        <Panel title={`Keys resgatadas (${user.redemptions.length})`}>
          {user.redemptions.length === 0 ? (
            <p className="text-sm text-ash">Nenhuma.</p>
          ) : (
            <Table minWidth="36rem">
              <thead><tr><Th>Key</Th><Th>Produto</Th><Th>Duração</Th><Th>Data</Th></tr></thead>
              <tbody>
                {user.redemptions.map((r) => (
                  <tr key={r.id}>
                    <Td className="font-mono text-xs">
                      {maskKey(r.key.last4)} {r.key.status === "REVOKED" && <Badge tone="danger">Revogada</Badge>}
                    </Td>
                    <Td>{r.product.name}</Td>
                    <Td>{DURATIONS[r.key.duration].label}</Td>
                    <Td className="text-xs text-ash">{formatDateTime(r.redeemedAt)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>

        <Panel title="Últimos downloads">
          {user.downloads.length === 0 ? (
            <p className="text-sm text-ash">Nenhum.</p>
          ) : (
            <ul className="divide-y divide-line text-sm">
              {user.downloads.map((d) => (
                <li key={d.id} className="flex justify-between gap-3 py-2">
                  <span>{d.product.name} · <span className="text-ash">{d.file.name}</span></span>
                  <span className="shrink-0 text-xs text-smoke">{formatDateTime(d.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

export default function AdminUsuario(props: PageProps<"/admin/usuarios/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-[36rem]" />}>
      <UserDetail params={props.params} />
    </Suspense>
  );
}
