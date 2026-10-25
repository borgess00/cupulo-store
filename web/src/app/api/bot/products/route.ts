import { NextResponse } from "next/server";
import { isBotAuthorized, unauthorized } from "@/lib/bot-auth";
import { db } from "@/lib/db";

// GET /api/bot/products — lista para o autocomplete dos comandos do bot.
export async function GET(req: Request) {
  if (!isBotAuthorized(req)) return unauthorized();
  const products = await db.product.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, slug: true, name: true, active: true, platform: true },
  });
  return NextResponse.json({ products });
}
