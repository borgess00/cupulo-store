import { NextResponse } from "next/server";
import { badRequest, isBotAuthorized, unauthorized } from "@/lib/bot-auth";
import { listUserAccesses } from "@/lib/access";
import { db } from "@/lib/db";

// GET /api/bot/users/:discordId — acessos de um cliente.
export async function GET(req: Request, ctx: RouteContext<"/api/bot/users/[discordId]">) {
  if (!isBotAuthorized(req)) return unauthorized();
  const { discordId } = await ctx.params;
  if (!/^\d{5,25}$/.test(discordId)) return badRequest("ID do Discord inválido");

  const user = await db.user.findUnique({ where: { discordId } });
  if (!user) return NextResponse.json({ user: null, accesses: [] });

  const accesses = await listUserAccesses(user.id);
  return NextResponse.json({
    user: {
      discordId: user.discordId,
      name: user.globalName ?? user.username,
      banned: user.banned,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
    accesses: accesses.map((a) => ({
      product: { slug: a.product.slug, name: a.product.name },
      status: a.status,
      lifetime: a.lifetime,
      expiresAt: a.lifetime ? null : a.expiresAt,
    })),
  });
}
