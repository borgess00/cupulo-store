import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { AdminTitle, fieldCls, pageNumber, Pagination, sp, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { discordAvatarUrl } from "@/lib/discord";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Usuários" };
const PER_PAGE = 40;

async function UsersAdmin({ searchParams }: { searchParams: PageProps<"/admin/usuarios">["searchParams"] }) {
  await requireAdmin();
  const raw = await searchParams;
  const q = sp(raw.q);
  const page = pageNumber(raw.page);
  const now = new Date();
  const where: Prisma.UserWhereInput = q
    ? /^\d{5,25}$/.test(q)
      ? { discordId: q }
      : { OR: [{ username: { contains: q, mode: "insensitive" } }, { globalName: { contains: q, mode: "insensitive" } }] }
    : {};
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { lastLoginAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        _count: {
          select: {
            redemptions: true,
            accesses: { where: { OR: [{ lifetime: true }, { expiresAt: { gt: now } }] } },
          },
        },
      },
    }),
  ]);

  return (
    <>
      <form role="search" className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Nome ou ID do Discord" aria-label="Buscar usuários" className={fieldCls} />
        <button type="submit" className={buttonClasses("outline", "md")}><Search className="h-4 w-4" /> Buscar</button>
      </form>
      <p className="mb-3 text-sm text-ash">{total} usuário(s)</p>
      <Table minWidth="48rem">
        <thead>
          <tr>
            <Th>Usuário</Th>
            <Th>ID do Discord</Th>
            <Th className="text-right">Acessos ativos</Th>
            <Th className="text-right">Keys</Th>
            <Th>Cliente desde</Th>
            <Th>Último login</Th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-white/[0.02]">
              <Td>
                <Link href={`/admin/usuarios/${u.id}`} className="flex items-center gap-2 font-semibold hover:underline">
                  <Image src={discordAvatarUrl(u.discordId, u.avatar, 64)} alt="" width={28} height={28} unoptimized className="rounded-full" />
                  {u.globalName ?? u.username}
                  {u.banned && <Badge tone="danger">Bloqueado</Badge>}
                </Link>
              </Td>
              <Td className="font-mono text-xs text-ash">{u.discordId}</Td>
              <Td className="text-right tabular-nums">{u._count.accesses}</Td>
              <Td className="text-right tabular-nums">{u._count.redemptions}</Td>
              <Td className="text-xs text-ash">{formatDate(u.createdAt)}</Td>
              <Td className="text-xs text-ash">{formatDateTime(u.lastLoginAt)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} params={{ q }} />
    </>
  );
}

export default function AdminUsuarios(props: PageProps<"/admin/usuarios">) {
  return (
    <>
      <AdminTitle title="Usuários" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <UsersAdmin searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
