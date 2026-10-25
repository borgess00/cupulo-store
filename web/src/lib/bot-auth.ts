import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

/** Confere "Authorization: Bearer <BOT_API_TOKEN>" em tempo constante. */
export function isBotAuthorized(req: Request): boolean {
  const expected = process.env.BOT_API_TOKEN;
  if (!expected || expected.length < 32) return false;
  const header = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const a = createHash("sha256").update(match[1]!.trim()).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export function badRequest(error: string, details?: unknown) {
  return NextResponse.json({ error, details }, { status: 400 });
}
