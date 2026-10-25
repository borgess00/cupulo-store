import { describe, expect, it } from "vitest";
import { APARELHOS } from "@/lib/sensi/aparelhos";
import { CONFIG, type EntradaSensi, gerarSensi, MIRAS, validarEntrada } from "@/lib/sensi/calculo";

const base: EntradaSensi = { tela: 6.1, ppi: 460, hz: 60, estilo: "equilibrado", dedos: 3 };

describe("gerador de sensi", () => {
  it("no aparelho de referência, estilo equilibrado e 3 dedos, devolve a base", () => {
    const r = gerarSensi(base);
    for (const m of MIRAS) expect(r[m]).toBe(CONFIG.base[m]);
  });

  it("tela menor → sensi maior; tela maior → sensi menor", () => {
    expect(gerarSensi({ ...base, tela: 4.7 }).geral).toBeGreaterThan(gerarSensi(base).geral);
    expect(gerarSensi({ ...base, tela: 6.9 }).geral).toBeLessThan(gerarSensi(base).geral);
  });

  it("agressivo é mais rápido que preciso no geral", () => {
    expect(gerarSensi({ ...base, estilo: "agressivo" }).geral).toBeGreaterThan(gerarSensi({ ...base, estilo: "preciso" }).geral);
  });

  it("sempre fica dentro de 0–200 e inteiro, para todos os aparelhos e estilos", () => {
    for (const a of APARELHOS) {
      for (const estilo of ["agressivo", "equilibrado", "preciso"] as const) {
        for (const dedos of [2, 3, 4] as const) {
          const r = gerarSensi({ tela: a.tela, ppi: a.ppi, hz: a.hz, estilo, dedos });
          for (const m of MIRAS) {
            expect(Number.isInteger(r[m])).toBe(true);
            expect(r[m]).toBeGreaterThanOrEqual(CONFIG.MIN);
            expect(r[m]).toBeLessThanOrEqual(CONFIG.MAX);
          }
        }
      }
    }
  });

  it("valida entradas fora do limite", () => {
    expect(validarEntrada(base)).toBeNull();
    expect(validarEntrada({ ...base, tela: 2 })).toMatch(/Tela/);
    expect(validarEntrada({ ...base, ppi: 9999 })).toMatch(/DPI/);
    expect(validarEntrada({ ...base, tela: NaN })).toMatch(/Tela/);
  });

  it("IDs de aparelho são únicos", () => {
    expect(new Set(APARELHOS.map((a) => a.id)).size).toBe(APARELHOS.length);
  });
});
