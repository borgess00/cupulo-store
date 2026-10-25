import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { grantManualAccess, hasActiveAccess, removeAccess, revokeKey } from "@/lib/access";
import { createKeys, describeKey } from "@/lib/key-service";
import { rateLimit } from "@/lib/rate-limit";
import { redeemKey } from "@/lib/redeem";
import { DAY, daysFromNow, makeProduct, makeUser, resetDb } from "./helpers";

beforeEach(resetDb);
afterAll(() => db.$disconnect());

async function newKeys(productId: string, duration: "DAYS_7" | "DAYS_30" | "LIFETIME", quantity = 1) {
  const { keys } = await createKeys({ productId, duration, quantity, origin: "ADMIN", createdBy: "100000000000000001" });
  return keys;
}

async function accessOf(userId: string, productId: string) {
  return db.access.findUniqueOrThrow({ where: { userId_productId: { userId, productId } } });
}

describe("geração", () => {
  it("guarda só o hash, nunca a key em texto", async () => {
    const p = await makeProduct();
    const [key] = await newKeys(p.id, "DAYS_30");
    const row = await db.key.findFirstOrThrow();
    expect(JSON.stringify(row)).not.toContain(key!.slice(7));
    expect(row.last4).toBe(key!.slice(-4));
    expect(row.keyHash).toHaveLength(64);
    expect(await db.auditLog.count({ where: { action: "KEY_GENERATE" } })).toBe(1);
  });

  it("gera lote com quantidade certa e mesmo batchId", async () => {
    const p = await makeProduct();
    const keys = await newKeys(p.id, "DAYS_7", 50);
    expect(new Set(keys).size).toBe(50);
    expect(await db.key.count()).toBe(50);
    expect((await db.key.groupBy({ by: ["batchId"] })).length).toBe(1);
  });
});

describe("resgate", () => {
  it("libera o produto e soma o tempo de keys do mesmo produto", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    const [k30] = await newKeys(p.id, "DAYS_30");
    const [k7] = await newKeys(p.id, "DAYS_7");

    const r1 = await redeemKey(u.id, k30!.toLowerCase());
    expect(r1.ok).toBe(true);
    expect(daysFromNow((await accessOf(u.id, p.id)).expiresAt)).toBeCloseTo(30, 2);

    const r2 = await redeemKey(u.id, k7!);
    expect(r2.ok).toBe(true);
    expect(daysFromNow((await accessOf(u.id, p.id)).expiresAt)).toBeCloseTo(37, 2);
    expect(await hasActiveAccess(u.id, p.id)).toBe(true);
    expect(await db.redemption.count()).toBe(2);
  });

  it("key não pode ser usada de novo", async () => {
    const p = await makeProduct();
    const [u1, u2] = [await makeUser(), await makeUser()];
    const [k] = await newKeys(p.id, "DAYS_7");
    expect((await redeemKey(u1.id, k!)).ok).toBe(true);
    expect(await redeemKey(u1.id, k!)).toEqual({ ok: false, code: "ALREADY_USED_BY_YOU" });
    expect(await redeemKey(u2.id, k!)).toEqual({ ok: false, code: "ALREADY_USED" });
    expect(await hasActiveAccess(u2.id, p.id)).toBe(false);
  });

  it("key inexistente ou mal formatada é inválida", async () => {
    const u = await makeUser();
    expect(await redeemKey(u.id, "CUPULO-AAAA-BBBB-CCCC")).toEqual({ ok: false, code: "INVALID" });
    expect(await redeemKey(u.id, "qualquer coisa")).toEqual({ ok: false, code: "INVALID" });
  });

  it("acesso expirado volta a contar de agora", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    await db.access.create({ data: { userId: u.id, productId: p.id, expiresAt: new Date(Date.now() - 20 * DAY) } });
    expect(await hasActiveAccess(u.id, p.id)).toBe(false);
    const [k] = await newKeys(p.id, "DAYS_7");
    await redeemKey(u.id, k!);
    expect(daysFromNow((await accessOf(u.id, p.id)).expiresAt)).toBeCloseTo(7, 2);
  });

  it("vitalícia vence o tempo, mas o tempo das temporárias fica guardado", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    const [k30] = await newKeys(p.id, "DAYS_30");
    const [kLife] = await newKeys(p.id, "LIFETIME");
    await redeemKey(u.id, k30!);
    const r = await redeemKey(u.id, kLife!);
    expect(r.ok && r.lifetime).toBe(true);
    const a = await accessOf(u.id, p.id);
    expect(a.lifetime).toBe(true);
    expect(daysFromNow(a.expiresAt)).toBeCloseTo(30, 2);
  });
});

describe("concorrência", () => {
  it("a mesma key resgatada por 10 contas ao mesmo tempo: só uma vence", async () => {
    const p = await makeProduct();
    const users = await Promise.all(Array.from({ length: 10 }, () => makeUser()));
    const [k] = await newKeys(p.id, "DAYS_30");
    const results = await Promise.all(users.map((u) => redeemKey(u.id, k!).catch((e) => ({ ok: false, error: e }))));
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await db.redemption.count()).toBe(1);
    expect(await db.access.count({ where: { expiresAt: { not: null } } })).toBe(1);
  });

  it("5 keys diferentes do mesmo produto ao mesmo tempo: o tempo soma inteiro", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    const keys = await newKeys(p.id, "DAYS_7", 5);
    const results = await Promise.all(keys.map((k) => redeemKey(u.id, k)));
    expect(results.every((r) => r.ok)).toBe(true);
    expect(daysFromNow((await accessOf(u.id, p.id)).expiresAt)).toBeCloseTo(35, 2);
  });
});

describe("revogação", () => {
  it("key revogada não pode ser resgatada", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    const [k] = await newKeys(p.id, "DAYS_30");
    const key = await db.key.findFirstOrThrow();
    expect((await revokeKey(key.id, "admin", "teste")).ok).toBe(true);
    expect(await revokeKey(key.id, "admin")).toEqual({ ok: false, code: "ALREADY_REVOKED" });
    expect(await redeemKey(u.id, k!)).toEqual({ ok: false, code: "REVOKED" });
  });

  it("revogar key resgatada tira os dias que ela deu", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    const [k30] = await newKeys(p.id, "DAYS_30");
    const [k7] = await newKeys(p.id, "DAYS_7");
    await redeemKey(u.id, k30!);
    await redeemKey(u.id, k7!);
    const key30 = await db.key.findFirstOrThrow({ where: { duration: "DAYS_30" } });
    await revokeKey(key30.id, "admin");
    expect(daysFromNow((await accessOf(u.id, p.id)).expiresAt)).toBeCloseTo(7, 2);
  });

  it("revogar a única vitalícia mantém o tempo das temporárias", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    const [k30] = await newKeys(p.id, "DAYS_30");
    const [kLife] = await newKeys(p.id, "LIFETIME");
    await redeemKey(u.id, k30!);
    await redeemKey(u.id, kLife!);
    const life = await db.key.findFirstOrThrow({ where: { duration: "LIFETIME" } });
    await revokeKey(life.id, "admin");
    const a = await accessOf(u.id, p.id);
    expect(a.lifetime).toBe(false);
    expect(daysFromNow(a.expiresAt)).toBeCloseTo(30, 2);
  });

  it("com duas vitalícias, revogar uma mantém o vitalício", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    const [a1, a2] = await newKeys(p.id, "LIFETIME", 2);
    await redeemKey(u.id, a1!);
    await redeemKey(u.id, a2!);
    const first = await db.key.findFirstOrThrow({ where: { status: "REDEEMED" } });
    await revokeKey(first.id, "admin");
    expect((await accessOf(u.id, p.id)).lifetime).toBe(true);
  });

  it("vitalício manual do admin sobrevive à revogação da key vitalícia", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    const [kLife] = await newKeys(p.id, "LIFETIME");
    await redeemKey(u.id, kLife!);
    await grantManualAccess(u.id, p.id, { lifetime: true }, "admin");
    const life = await db.key.findFirstOrThrow();
    await revokeKey(life.id, "admin");
    expect((await accessOf(u.id, p.id)).lifetime).toBe(true);
  });
});

describe("acesso manual", () => {
  it("concede dias, concede vitalício e remove tudo", async () => {
    const p = await makeProduct();
    const u = await makeUser();
    await grantManualAccess(u.id, p.id, { days: 10 }, "admin");
    expect(daysFromNow((await accessOf(u.id, p.id)).expiresAt)).toBeCloseTo(10, 2);
    await grantManualAccess(u.id, p.id, { lifetime: true }, "admin");
    expect(await hasActiveAccess(u.id, p.id)).toBe(true);
    await removeAccess(u.id, p.id, "admin");
    expect(await hasActiveAccess(u.id, p.id)).toBe(false);
    // Depois de remover, uma key nova volta a liberar do zero.
    const [k] = await newKeys(p.id, "DAYS_7");
    await redeemKey(u.id, k!);
    expect(daysFromNow((await accessOf(u.id, p.id)).expiresAt)).toBeCloseTo(7, 2);
    expect(await db.auditLog.count({ where: { action: { in: ["ACCESS_GRANT", "ACCESS_REMOVE"] } } })).toBe(3);
  });
});

describe("describeKey (API do bot)", () => {
  it("mostra status, produto e quem resgatou", async () => {
    const p = await makeProduct();
    const u = await makeUser("cliente");
    const [k] = await newKeys(p.id, "DAYS_30");
    expect((await describeKey(k!))?.status).toBe("AVAILABLE");
    await redeemKey(u.id, k!);
    const info = await describeKey(k!);
    expect(info?.status).toBe("REDEEMED");
    expect(info?.duration).toBe("30d");
    expect(info?.redemption?.user.discordId).toBe(u.discordId);
    expect(info?.redemption?.access?.status).toBe("active");
    expect(await describeKey("CUPULO-AAAA-BBBB-CCCC")).toBeNull();
  });
});

describe("rate limit", () => {
  it("bloqueia a 6ª tentativa no mesmo minuto e libera depois da janela", async () => {
    const results = [];
    for (let i = 0; i < 6; i++) results.push(await rateLimit("teste:u1", 5, 60));
    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true);
    expect(results[5]!.ok).toBe(false);
    expect(results[5]!.retryAfterSec).toBeGreaterThan(0);
    // Simula a janela vencida.
    await db.rateLimit.update({ where: { bucket: "teste:u1" }, data: { windowStart: new Date(Date.now() - 61_000) } });
    expect((await rateLimit("teste:u1", 5, 60)).ok).toBe(true);
  });

  it("contagem é atômica com chamadas simultâneas", async () => {
    const results = await Promise.all(Array.from({ length: 12 }, () => rateLimit("teste:paralelo", 5, 60)));
    expect(results.filter((r) => r.ok)).toHaveLength(5);
  });
});
