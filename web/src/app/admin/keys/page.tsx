import Link from "next/link";
import { Suspense } from "react";
import { FileDown, Search } from "lucide-react";
import { KeyGenerator } from "@/components/admin/key-generator";
import { RevokeButton } from "@/components/admin/revoke-button";
import { AdminTitle, fieldCls, pageNumber, Pagination, Panel, sp, Table, Td, Th } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { buildKeyWhere } from "@/lib/admin-keys";
import { db } from "@/lib/db";
import { DURATIONS } from "@/lib/durations";
import { formatDateTime } from "@/lib/format";
import { maskKey } from "@/lib/keys";
import { requireAdmin } from "@/lib/session";

export const metadata = { title: "Keys" };

const PER_PAGE = 50;
const STATUS = { AVAILABLE: "Disponível", REDEEMED: "Resgatada", REVOKED: "Revogada" } as const;

async function KeysAdmin({ searchParams }: { searchParams: PageProps<"/admin/keys">["searchParams"] }) {
  await requireAdmin();
  const raw = await searchParams;
  const filters = { q: sp(raw.q), status: sp(raw.status), product: sp(raw.product), batch: sp(raw.batch) };
  const page = pageNumber(raw.page);
  const where = buildKeyWhere(filters);

  const [products, total, keys] = await Promise.all([
    db.product.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    db.key.count({ where }),
    db.key.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        product: { select: { name: true } },
        redemption: { include: { user: { select: { id: true, username: true, globalName: true, discordId: true } } } },
      },
    }),
  ]);
  const exportQs = new URLSearchParams(Object.entries(filters).filter((e): e is [string, string] => !!e[1])).toString();

  return (
    <div className="space-y-6">
      <Panel title="Gerar keys em lote">
        <KeyGenerator products={products} />
      </Panel>

      <Panel
        title={`Keys (${total})`}
        actions={
          <a href={`/admin/keys/export?${exportQs}`} className={buttonClasses("ghost", "sm")}>
            <FileDown className="h-4 w-4" /> Exportar lista (.csv)
          </a>
        }
      >
        <form className="mb-4 grid gap-2 sm:grid-cols-[1fr_10rem_12rem_auto]" role="search">
          <input
            name="q"
            defaultValue={filters.q}
            placeholder="Key completa, 4 últimos, ID do Discord, nome…"
            aria-label="Buscar keys"
            className={fieldCls}
          />
          <select name="status" defaultValue={filters.status ?? ""} aria-label="Status" className={fieldCls}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select name="product" defaultValue={filters.product ?? ""} aria-label="Produto" className={fieldCls}>
            <option value="">Todos os produtos</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="submit" className={buttonClasses("outline", "md")}>
            <Search className="h-4 w-4" /> Buscar
          </button>
        </form>

        {keys.length === 0 ? (
          <p className="py-6 text-center text-sm text-ash">Nenhuma key encontrada.</p>
        ) : (
          <Table minWidth="58rem">
            <thead>
              <tr>
                <Th>Key</Th>
                <Th>Produto</Th>
                <Th>Status</Th>
                <Th>Criada</Th>
                <Th>Resgatada por</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="hover:bg-white/[0.02]">
                  <Td className="font-mono text-xs">
                    {maskKey(k.last4)}
                    {k.note && <p className="font-sans text-xs text-smoke">{k.note}</p>}
                  </Td>
                  <Td>
                    {k.product.name}
                    <p className="text-xs text-smoke">{DURATIONS[k.duration].label}</p>
                  </Td>
                  <Td>
                    <Badge tone={k.status === "REVOKED" ? "danger" : k.status === "REDEEMED" ? "solid" : "default"}>{STATUS[k.status]}</Badge>
                    {k.revokeReason && <p className="mt-1 text-xs text-smoke">{k.revokeReason}</p>}
                  </Td>
                  <Td className="text-xs text-ash">
                    {formatDateTime(k.createdAt)}
                    <p className="text-smoke">{k.origin === "BOT" ? "bot" : "painel"} · {k.createdBy}</p>
                  </Td>
                  <Td className="text-xs">
                    {k.redemption ? (
                      <>
                        <Link href={`/admin/usuarios/${k.redemption.user.id}`} className="font-semibold hover:underline">
                          {k.redemption.user.globalName ?? k.redemption.user.username}
                        </Link>
                        <p className="text-smoke">{formatDateTime(k.redemption.redeemedAt)}</p>
                      </>
                    ) : (
                      <span className="text-smoke">—</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    {k.status !== "REVOKED" && <RevokeButton keyId={k.id} redeemed={k.status === "REDEEMED"} />}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination page={page} totalPages={Math.ceil(total / PER_PAGE)} params={filters} />
      </Panel>
    </div>
  );
}

export default function AdminKeys(props: PageProps<"/admin/keys">) {
  return (
    <>
      <AdminTitle title="Keys" />
      <Suspense fallback={<Skeleton className="h-[36rem]" />}>
        <KeysAdmin searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
