import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { AdminTitle, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { PLATFORM_LABEL } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Produtos" };

async function ProductList() {
  await requireAdmin();
  const now = new Date();
  const products = await db.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          files: true,
          keys: true,
          accesses: { where: { OR: [{ lifetime: true }, { expiresAt: { gt: now } }] } },
        },
      },
    },
  });
  return (
    <Table minWidth="44rem">
      <thead>
        <tr>
          <Th>Produto</Th>
          <Th>Plataforma</Th>
          <Th>Status</Th>
          <Th className="text-right">Arquivos</Th>
          <Th className="text-right">Keys</Th>
          <Th className="text-right">Clientes ativos</Th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id} className="hover:bg-white/[0.02]">
            <Td>
              <Link href={`/admin/produtos/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
              <p className="text-xs text-smoke">/{p.slug} · {p.category}</p>
            </Td>
            <Td>{PLATFORM_LABEL[p.platform]}</Td>
            <Td>{p.active ? <Badge>Ativo</Badge> : <Badge tone="muted">Oculto</Badge>}</Td>
            <Td className="text-right tabular-nums">{p._count.files}</Td>
            <Td className="text-right tabular-nums">{p._count.keys}</Td>
            <Td className="text-right tabular-nums">{p._count.accesses}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default function AdminProdutos() {
  return (
    <>
      <AdminTitle title="Produtos">
        <ButtonLink href="/admin/produtos/novo" size="sm"><Plus className="h-4 w-4" /> Novo produto</ButtonLink>
      </AdminTitle>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProductList />
      </Suspense>
    </>
  );
}
