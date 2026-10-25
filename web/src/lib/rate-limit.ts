import "server-only";
import { db } from "@/lib/db";

export type RateLimitResult = { ok: boolean; remaining: number; retryAfterSec: number };

/**
 * Janela fixa guardada no Postgres (funciona com várias instâncias serverless).
 * Um único INSERT … ON CONFLICT torna a contagem atômica.
 */
export async function rateLimit(bucket: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const rows = await db.$queryRaw<{ count: number; elapsed: number }[]>`
    INSERT INTO "RateLimit" ("bucket", "count", "windowStart")
    VALUES (${bucket}, 1, now())
    ON CONFLICT ("bucket") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowSec}::int)
                     THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowSec}::int)
                     THEN now() ELSE "RateLimit"."windowStart" END
    RETURNING "count", EXTRACT(EPOCH FROM (now() - "windowStart"))::float8 AS "elapsed"`;

  const { count, elapsed } = rows[0]!;

  // Faxina ocasional de janelas antigas.
  if (Math.random() < 0.02) {
    await db.$executeRaw`DELETE FROM "RateLimit" WHERE "windowStart" < now() - interval '1 day'`;
  }

  return {
    ok: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.max(1, Math.ceil(windowSec - elapsed)),
  };
}
