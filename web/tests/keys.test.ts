import { describe, expect, it } from "vitest";
import { generateKey, hashKey, KEY_ALPHABET, maskKey, normalizeKey } from "@/lib/keys";

describe("formato das keys", () => {
  it("gera no formato CUPULO-XXXX-XXXX-XXXX", () => {
    for (let i = 0; i < 500; i++) {
      expect(generateKey()).toMatch(/^CUPULO-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    }
  });

  it("nunca usa caracteres ambíguos (0, O, 1, I)", () => {
    expect(KEY_ALPHABET).not.toMatch(/[01OI]/);
    const body = Array.from({ length: 2000 }, () => generateKey().slice(7)).join("");
    expect(body).not.toMatch(/[01OI]/);
  });

  it("não repete keys em 20 mil gerações", () => {
    const set = new Set(Array.from({ length: 20000 }, generateKey));
    expect(set.size).toBe(20000);
  });
});

describe("normalizeKey", () => {
  const k = "CUPULO-ABCD-EFGH-JK23";
  it.each([
    k,
    "cupulo-abcd-efgh-jk23",
    "  CUPULO ABCD EFGH JK23 ",
    "ABCDEFGHJK23",
    "abcd-efgh-jk23",
    "CUPULOABCDEFGHJK23",
  ])("aceita %s", (input) => {
    expect(normalizeKey(input)).toBe(k);
  });

  it.each(["", "CUPULO-ABCD-EFGH", "CUPULO-ABCD-EFGH-JK2O", "CUPULO-ABCD-EFGH-JK21", "CUPULO-ABCD-EFGH-JK234", "x".repeat(100)])(
    "rejeita %s",
    (input) => {
      expect(normalizeKey(input)).toBeNull();
    },
  );
});

describe("hashKey", () => {
  it("é determinístico e depende do pepper", () => {
    const k = generateKey();
    expect(hashKey(k)).toBe(hashKey(k));
    expect(hashKey(k)).toHaveLength(64);
    expect(hashKey(k, "outro-pepper-com-mais-de-32-caracteres-xxxxx")).not.toBe(hashKey(k));
  });

  it("recusa pepper curto", () => {
    expect(() => hashKey("CUPULO-AAAA-AAAA-AAAA", "curto")).toThrow();
  });

  it("mascara mostrando só os 4 últimos", () => {
    expect(maskKey("JK23")).toBe("CUPULO-••••-••••-JK23");
  });
});
