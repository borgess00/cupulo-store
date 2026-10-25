import { NextResponse } from "next/server";
import { isBotAuthorized, unauthorized } from "@/lib/bot-auth";
import { describeKey } from "@/lib/key-service";

// GET /api/bot/keys/:key — status de uma key.
export async function GET(req: Request, ctx: RouteContext<"/api/bot/keys/[key]">) {
  if (!isBotAuthorized(req)) return unauthorized();
  const { key } = await ctx.params;
  const info = await describeKey(key);
  if (!info) return NextResponse.json({ error: "Key não encontrada" }, { status: 404 });
  return NextResponse.json({ key: info });
}
