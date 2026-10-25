import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { buildKeyWhere } from "@/lib/admin-keys";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { DURATIONS } from "@/lib/durations";
import { isAdminDiscordId } from "@/lib/env";
import { maskKey } from "@/lib/keys";

// Exporta a lista de keys filtrada (mascaradas: o texto original não existe mais no banco).
export async function GET(req: Request) {
  const session = await auth();
  if (!isAdminDiscordId(session?.user?.discordId)) return new NextResponse("Não autorizado", { status: 403 });

  const p = new URL(req.url).searchParams;
  const where = buildKeyWhere({
    q: p.get("q") ?? undefined,
    status: p.get("status") ?? undefined,
    product: p.get("product") ?? undefined,
    batch: p.get("batch") ?? undefined,
  });
  const keys = await db.key.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 20000,
    include: { product: { select: { name: true } }, redemption: { include: { user: true } } },
  });

  const csv = toCsv([
    ["key", "produto", "duracao", "status", "origem", "gerada_por", "gerada_em", "lote", "observacao", "resgatada_por_id", "resgatada_por_nome", "resgatada_em", "motivo_revogacao"],
    ...keys.map((k) => [
      maskKey(k.last4),
      k.product.name,
      DURATIONS[k.duration].label,
      k.status,
      k.origin,
      k.createdBy,
      k.createdAt.toISOString(),
      k.batchId,
      k.note,
      k.redemption?.user.discordId,
      k.redemption ? (k.redemption.user.globalName ?? k.redemption.user.username) : null,
      k.redemption?.redeemedAt.toISOString(),
      k.revokeReason,
    ]),
  ]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="keys-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
