import { after, NextResponse } from "next/server";
import { z } from "@/lib/zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DURATIONS } from "@/lib/durations";
import { clientIp, hashIp } from "@/lib/ip";
import { isSameOrigin } from "@/lib/origin";
import { rateLimit } from "@/lib/rate-limit";
import { REDEEM_MESSAGES, redeemKey } from "@/lib/redeem";
import { notifyRedemption } from "@/lib/webhook";

const Body = z.object({ key: z.string().min(1).max(64) });

const LIMIT = 5;
const WINDOW_SEC = 60;

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ ok: false, message: "Requisição bloqueada." }, { status: 403 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "Faça login com o Discord para resgatar." }, { status: 401 });
  }
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.banned) {
    return NextResponse.json({ ok: false, message: "Sua conta não pode resgatar keys." }, { status: 403 });
  }

  // 5 tentativas por minuto por usuário E por IP (contra força bruta).
  const ip = hashIp(clientIp(req.headers));
  const [byUser, byIp] = await Promise.all([
    rateLimit(`redeem:user:${user.id}`, LIMIT, WINDOW_SEC),
    rateLimit(`redeem:ip:${ip}`, LIMIT, WINDOW_SEC),
  ]);
  if (!byUser.ok || !byIp.ok) {
    const wait = Math.max(byUser.ok ? 0 : byUser.retryAfterSec, byIp.ok ? 0 : byIp.retryAfterSec);
    return NextResponse.json(
      { ok: false, code: "RATE_LIMITED", message: `Muitas tentativas. Aguarde ${wait}s e tente de novo.` },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, code: "INVALID", message: REDEEM_MESSAGES.INVALID }, { status: 400 });
  }

  const result = await redeemKey(user.id, body.data.key);
  if (!result.ok) {
    const status = result.code === "INVALID" ? 404 : 409;
    return NextResponse.json({ ok: false, code: result.code, message: REDEEM_MESSAGES[result.code] }, { status });
  }

  after(() =>
    notifyRedemption({
      user: { discordId: user.discordId, name: user.globalName ?? user.username, avatar: user.avatar },
      product: result.product,
      durationLabel: DURATIONS[result.duration].label,
      expiresAt: result.expiresAt,
      lifetime: result.lifetime,
    }),
  );

  return NextResponse.json({
    ok: true,
    message: "Key resgatada! Produto liberado.",
    product: result.product,
    duration: DURATIONS[result.duration].label,
    lifetime: result.lifetime,
    expiresAt: result.expiresAt?.toISOString() ?? null,
  });
}
