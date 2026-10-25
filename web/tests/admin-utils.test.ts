import { describe, expect, it } from "vitest";
import { buildKeyWhere } from "@/lib/admin-keys";
import { toCsv } from "@/lib/csv";
import { hashKey } from "@/lib/keys";
import { safeRedirectPath } from "@/lib/safe-redirect";
import { safeFileName, slugify } from "@/lib/slug";
import { formatRemaining } from "@/lib/format";
import { youtubeId } from "@/lib/youtube";

describe("csv", () => {
  it("escapa aspas, vírgulas e bloqueia fórmulas do Excel", () => {
    const csv = toCsv([["a,b", 'diz "oi"', "=HYPERLINK(1)", null]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.slice(1)).toBe(`"a,b","diz ""oi""",'=HYPERLINK(1),`);
  });
});

describe("busca de keys no admin", () => {
  it("key completa busca pelo hash", () => {
    expect(buildKeyWhere({ q: "cupulo-abcd-efgh-jk23" })).toEqual({ AND: [{ keyHash: hashKey("CUPULO-ABCD-EFGH-JK23") }] });
  });
  it("4 caracteres busca pelos últimos 4", () => {
    expect(buildKeyWhere({ q: "jk23" })).toEqual({ AND: [{ last4: "JK23" }] });
  });
  it("ID do Discord busca por quem gerou ou resgatou", () => {
    const w = buildKeyWhere({ q: "123456789012345678" });
    expect(JSON.stringify(w)).toContain("createdBy");
  });
  it("ignora status desconhecido", () => {
    expect(buildKeyWhere({ status: "DROP TABLE" })).toEqual({});
  });
});

describe("helpers", () => {
  it("slugify e nomes de arquivo seguros", () => {
    expect(slugify("Pack Pró Ação!")).toBe("pack-pro-acao");
    expect(safeFileName("../../etc/passwd")).toBe("etc-passwd");
    expect(safeFileName("Sensi Átila v2.zip")).toBe("Sensi-Atila-v2.zip");
  });
  it("redirect só para caminhos internos", () => {
    expect(safeRedirectPath("/produto/x")).toBe("/produto/x");
    expect(safeRedirectPath("https://malicioso.com")).toBe("/biblioteca");
    expect(safeRedirectPath("//malicioso.com")).toBe("/biblioteca");
    expect(safeRedirectPath("/\\malicioso.com")).toBe("/biblioteca");
  });
  it("youtube: extrai o ID dos formatos comuns", () => {
    for (const u of ["https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3", "https://youtube.com/shorts/dQw4w9WgXcQ", "https://m.youtube.com/watch?v=dQw4w9WgXcQ"]) {
      expect(youtubeId(u)).toBe("dQw4w9WgXcQ");
    }
    expect(youtubeId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeId("javascript:alert(1)")).toBeNull();
  });
  it("contador", () => {
    expect(formatRemaining(0)).toBe("Expirado");
    expect(formatRemaining((2 * 86400 + 3 * 3600 + 4 * 60) * 1000)).toBe("2d 03h 04m");
    expect(formatRemaining(65 * 1000)).toBe("00h 01m 05s");
  });
});
