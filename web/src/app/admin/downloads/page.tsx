import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { AdminTitle, fieldCls, pageNumber, Pagination, sp, Table, Td, Th } from "@/components/admin/ui";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Downloads" };
const PER_PAGE = 50;

async function DownloadsAdmin({ searchParams }: { searchParams: PageProps<"/admin/downloads">["searchParams"] }) {
  await requireAdmin();
  const raw = await searchParams;
  const product = sp(raw.product);
  const q = sp(raw.q);
  const page = pageNumber(raw.page);
  const where: Prisma.DownloadLogWhereInput = {
    ...(product ? { productId: product } : {}),
    ...(q
      ? /^\d{5,25}$/.test(q)
        ? { user: { discordId: q } }
        : { user: { OR: [{ username: { contains: q, mode: "insensitive" } }, { globalName: { contains: q, mode: "insensitive" } }] } }
      : {}),
  };
  const [products, total, logs] = await Promise.all([
    db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.downloadLog.count({ where }),
    db.downloadLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        user: { select: { id: true, username: true, globalName: true } },
        product: { select: { name: true } },
        file: { select: { name: true, version: true } },
      },
    }),
  ]);

  return (
    <>
      <form role="search" className="mb-4 grid gap-2 sm:grid-cols-[1fr_14rem_auto]">
        <input name="q" defaultValue={q} placeholder="Nome ou ID do Discord" aria-label="Buscar por usuário" className={fieldCls} />
        <select name="product" defaultValue={product ?? ""} aria-label="Produto" className={fieldCls}>
          <option value="">Todos os produtos</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="submit" className={buttonClasses("outline", "md")}><Search className="h-4 w-4" /> Filtrar</button>
      </form>
      <p className="mb-3 text-sm text-ash">{total} download(s)</p>
      <Table minWidth="44rem">
        <thead><tr><Th>Data</Th><Th>Usuário</Th><Th>Produto</Th><Th>Arquivo</Th><Th>Aparelho</Th></tr></thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <Td className="whitespace-nowrap text-xs text-ash">{formatDateTime(l.createdAt)}</Td>
              <Td>
                <Link href={`/admin/usuarios/${l.user.id}`} className="font-semibold hover:underline">{l.user.globalName ?? l.user.username}</Link>
              </Td>
              <Td>{l.product.name}</Td>
              <Td className="text-xs">{l.file.name}{l.file.version && ` (v${l.file.version})`}</Td>
              <Td className="max-w-56 truncate text-xs text-smoke" >{l.userAgent ?? "—"}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} params={{ q, product }} />
    </>
  );
}

export default function AdminDownloads(props: PageProps<"/admin/downloads">) {
  return (
    <>
      <AdminTitle title="Log de downloads" />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <DownloadsAdmin searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
