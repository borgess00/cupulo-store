import "server-only";
import { db } from "@/lib/db";

export async function getDashboardStats() {
  const now = new Date();
  const [users, keysTotal, keysRedeemed, keysRevoked, activeAccesses, downloads30, byProductRaw, products, daily, recent] =
    await Promise.all([
      db.user.count(),
      db.key.count(),
      db.key.count({ where: { status: "REDEEMED" } }),
      db.key.count({ where: { status: "REVOKED" } }),
      db.access.count({ where: { OR: [{ lifetime: true }, { expiresAt: { gt: now } }] } }),
      db.downloadLog.count({ where: { createdAt: { gt: new Date(now.getTime() - 30 * 86400000) } } }),
      db.redemption.groupBy({ by: ["productId"], _count: { _all: true } }),
      db.product.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
      // Resgates por dia nos últimos 30 dias, no fuso de Brasília (inclui dias zerados).
      db.$queryRaw<{ day: string; redemptions: number; generated: number }[]>`
        WITH days AS (
          SELECT generate_series(
            (now() AT TIME ZONE 'America/Sao_Paulo')::date - 29,
            (now() AT TIME ZONE 'America/Sao_Paulo')::date,
            interval '1 day'
          )::date AS day
        )
        SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
          (SELECT count(*)::int FROM "Redemption" r
             WHERE (r."redeemedAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = d.day) AS redemptions,
          (SELECT count(*)::int FROM "Key" k
             WHERE (k."createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = d.day) AS generated
        FROM days d ORDER BY d.day`,
      db.redemption.findMany({
        take: 8,
        orderBy: { redeemedAt: "desc" },
        include: {
          user: { select: { id: true, username: true, globalName: true } },
          product: { select: { name: true } },
          key: { select: { duration: true } },
        },
      }),
    ]);

  const counts = new Map(byProductRaw.map((r) => [r.productId, r._count._all]));
  const byProduct = products
    .map((p) => ({ name: p.name, count: counts.get(p.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return {
    users,
    keysTotal,
    keysRedeemed,
    keysAvailable: keysTotal - keysRedeemed - keysRevoked,
    keysRevoked,
    activeAccesses,
    downloads30,
    byProduct,
    daily,
    recent,
  };
}
