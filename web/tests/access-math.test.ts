import { describe, expect, it } from "vitest";
import { accessStatus, DAY_MS, extendExpiry, isAccessActive, shrinkExpiry } from "@/lib/access-math";

const now = new Date("2026-01-10T12:00:00Z");

describe("extendExpiry", () => {
  it("sem acesso: conta a partir de agora", () => {
    expect(extendExpiry(null, 7, now).getTime()).toBe(now.getTime() + 7 * DAY_MS);
  });
  it("acesso ativo: soma ao fim atual", () => {
    const fim = new Date(now.getTime() + 3 * DAY_MS);
    expect(extendExpiry(fim, 30, now).getTime()).toBe(fim.getTime() + 30 * DAY_MS);
  });
  it("acesso expirado: recomeça de agora (não soma tempo perdido)", () => {
    const fim = new Date(now.getTime() - 10 * DAY_MS);
    expect(extendExpiry(fim, 7, now).getTime()).toBe(now.getTime() + 7 * DAY_MS);
  });
});

describe("status", () => {
  it("vitalício sempre ativo", () => {
    expect(isAccessActive({ lifetime: true, expiresAt: null }, now)).toBe(true);
    expect(accessStatus({ lifetime: true, expiresAt: new Date(0) }, now)).toBe("lifetime");
  });
  it("temporário ativo/expirado", () => {
    expect(accessStatus({ lifetime: false, expiresAt: new Date(now.getTime() + 1000) }, now)).toBe("active");
    expect(accessStatus({ lifetime: false, expiresAt: new Date(now.getTime() - 1000) }, now)).toBe("expired");
    expect(accessStatus({ lifetime: false, expiresAt: null }, now)).toBe("expired");
  });
  it("shrinkExpiry tira os dias", () => {
    const fim = new Date(now.getTime() + 37 * DAY_MS);
    expect(shrinkExpiry(fim, 7)!.getTime()).toBe(now.getTime() + 30 * DAY_MS);
    expect(shrinkExpiry(null, 7)).toBeNull();
  });
});
