import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../src/api.js";
import { commands } from "../src/commands/index.js";
import { loadConfig } from "../src/config.js";
import { deliveryMessage, redeemUrl } from "../src/embeds.js";
import { handleInteraction, hasStaffRole } from "../src/handler.js";
import { config, embedsJson, fakeInteraction, fakeUser, mockApi } from "./fakes.js";

const generated = (key = "CUPULO-ABCD-EFGH-JK23") => ({
  status: 201,
  body: {
    product: { id: "p1", slug: "pack-android", name: "Pack Android" },
    duration: "30d",
    durationLabel: "30 dias",
    batchId: "b1",
    keys: [key],
  },
});

describe("configuração", () => {
  it("valida o .env e explica o erro em português", () => {
    expect(() => loadConfig({})).toThrow(/Configuração inválida/);
    const ok = loadConfig({
      DISCORD_TOKEN: "x".repeat(30),
      DISCORD_CLIENT_ID: "111111111111111111",
      DISCORD_GUILD_ID: "222222222222222222",
      STAFF_ROLE_IDS: "333333333333333333, 666666666666666666",
      CLIENT_ROLE_ID: "",
      SITE_URL: "https://site.com/",
      BOT_API_TOKEN: "t".repeat(40),
    });
    expect(ok.STAFF_ROLE_IDS).toHaveLength(2);
    expect(ok.CLIENT_ROLE_ID).toBeUndefined();
    expect(ok.SITE_URL).toBe("https://site.com");
  });
});

describe("permissão de staff", () => {
  it("funciona com membro da API (array) e em cache (Collection)", () => {
    expect(hasStaffRole({ roles: ["333333333333333333"] }, config.STAFF_ROLE_IDS)).toBe(true);
    expect(hasStaffRole({ roles: { cache: new Map([["333333333333333333", {}]]) } }, config.STAFF_ROLE_IDS)).toBe(true);
    expect(hasStaffRole({ roles: [] }, config.STAFF_ROLE_IDS)).toBe(false);
    expect(hasStaffRole(null, config.STAFF_ROLE_IDS)).toBe(false);
  });

  it("bloqueia comandos de staff para quem não é staff, sem chamar a API", async () => {
    const { ctx, calls } = mockApi(() => generated());
    const { interaction, state } = fakeInteraction("gerarkey", { produto: "pack-android", duracao: "30d" }, { staff: false });
    await handleInteraction(interaction as never, ctx);
    expect(calls).toHaveLength(0);
    expect(JSON.stringify(embedsJson(state.replies[0]))).toContain("só para a staff");
  });

  it("bloqueia comandos de staff vindos de outro servidor", async () => {
    const { ctx, calls } = mockApi(() => generated());
    const { interaction } = fakeInteraction("gerarkey", { produto: "x", duracao: "7d" }, { guildId: "1234567890" });
    await handleInteraction(interaction as never, ctx);
    expect(calls).toHaveLength(0);
  });

  it("/resgatar é público", async () => {
    const { ctx } = mockApi(() => ({ status: 200, body: {} }));
    const { interaction, state } = fakeInteraction("resgatar", {}, { staff: false });
    await handleInteraction(interaction as never, ctx);
    expect(JSON.stringify(embedsJson(state.replies[0]))).toContain("Como resgatar");
  });
});

describe("API do site", () => {
  it("manda o Bearer token e traduz erros", async () => {
    const { ctx, calls } = mockApi((path) =>
      path === "/products" ? { status: 401, body: { error: "Não autorizado" } } : { status: 404, body: { error: "Key não encontrada" } },
    );
    await expect(ctx.api.listProducts()).rejects.toThrow(/BOT_API_TOKEN/);
    expect((calls[0]!.init!.headers as Record<string, string>).Authorization).toBe(`Bearer ${config.BOT_API_TOKEN}`);
    expect(await ctx.api.getKey("CUPULO-AAAA-BBBB-CCCC")).toBeNull();
  });

  it("guarda a lista de produtos em cache por 60 s", async () => {
    const { ctx, calls } = mockApi(() => ({ status: 200, body: { products: [{ id: "1", slug: "a", name: "A", active: true, platform: "IOS" }] } }));
    await ctx.api.listProducts();
    await ctx.api.listProducts();
    expect(calls).toHaveLength(1);
  });

  it("site fora do ar vira mensagem amigável", async () => {
    const { ctx } = mockApi(() => {
      throw new Error("ECONNREFUSED");
    });
    await expect(ctx.api.listProducts()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("/entregar", () => {
  it("gera a key, manda na DM com o link de resgate, dá o cargo e registra no log", async () => {
    const { ctx, calls } = mockApi(() => generated());
    const cliente = fakeUser("777777777777777777", "cliente");
    const { interaction, state, rolesAdded, logMessages } = fakeInteraction("entregar", {
      usuario: cliente,
      produto: "pack-android",
      duracao: "30d",
    });
    await handleInteraction(interaction as never, ctx);

    const body = JSON.parse(String(calls[0]!.init!.body));
    expect(body).toMatchObject({ product: "pack-android", duration: "30d", quantity: 1, createdBy: "999999999999999999" });
    expect(cliente.sent).toHaveLength(1);
    const dm = JSON.stringify(cliente.sent[0], (_k, v) => (v && typeof v.toJSON === "function" ? v.toJSON() : v));
    expect(dm).toContain("CUPULO-ABCD-EFGH-JK23");
    expect(dm).toContain("https://cupulo.test/resgatar?key=CUPULO-ABCD-EFGH-JK23");
    expect(rolesAdded).toEqual([config.CLIENT_ROLE_ID]);
    expect(JSON.stringify(embedsJson(state.edits[0]))).toContain("Key entregue");
    // O log da staff não mostra a key inteira.
    const log = JSON.stringify(embedsJson(logMessages[0]));
    expect(log).toContain("JK23");
    expect(log).not.toContain("CUPULO-ABCD-EFGH-JK23");
  });

  it("com DM fechada, avisa a staff e mostra a key para entrega manual", async () => {
    const { ctx } = mockApi(() => generated());
    const cliente = fakeUser("777777777777777777", "cliente", { dmClosed: true });
    const { interaction, state } = fakeInteraction("entregar", { usuario: cliente, produto: "pack-android", duracao: "30d" });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await handleInteraction(interaction as never, ctx);
    const reply = JSON.stringify(embedsJson(state.edits[0]));
    expect(reply).toContain("DM fechada");
    expect(reply).toContain("CUPULO-ABCD-EFGH-JK23");
  });

  it("não entrega para bots", async () => {
    const { ctx, calls } = mockApi(() => generated());
    const { interaction, state } = fakeInteraction("entregar", { usuario: fakeUser("1".repeat(18), "bot", { bot: true }), produto: "x", duracao: "7d" });
    await handleInteraction(interaction as never, ctx);
    expect(calls).toHaveLength(0);
    expect(JSON.stringify(state.edits[0])).toContain("bot");
  });

  it("erro da API aparece para a staff", async () => {
    const { ctx } = mockApi(() => ({ status: 404, body: { error: "Produto não encontrado" } }));
    const { interaction, state } = fakeInteraction("entregar", { usuario: fakeUser("7".repeat(18), "c"), produto: "nao-existe", duracao: "7d" });
    await handleInteraction(interaction as never, ctx);
    expect(JSON.stringify(embedsJson(state.edits[0]))).toContain("Produto não encontrado");
  });
});

describe("/gerarkey", () => {
  it("mais de 20 keys vão em arquivo .txt", async () => {
    const keys = Array.from({ length: 25 }, (_, i) => `CUPULO-AAAA-BBBB-${String(i).padStart(4, "2").replace(/[01]/g, "2")}`);
    const { ctx } = mockApi(() => ({ status: 201, body: { ...generated().body, keys } }));
    const { interaction, state } = fakeInteraction("gerarkey", { produto: "pack-android", duracao: "30d", quantidade: 25 });
    await handleInteraction(interaction as never, ctx);
    const edit = state.edits[0] as { files: { name: string }[] };
    expect(edit.files.map((f) => f.name)).toContain("keys-pack-android-30d.txt");
  });
});

describe("embeds", () => {
  it("todos os comandos têm nome e descrição válidos para o Discord", () => {
    for (const c of commands) {
      const json = c.data.toJSON();
      expect(json.name).toMatch(/^[a-z0-9_-]{1,32}$/);
      expect(json.description.length).toBeLessThanOrEqual(100);
    }
  });
  it("link de resgate leva a key", () => {
    expect(redeemUrl("https://s.com", "CUPULO-A")).toBe("https://s.com/resgatar?key=CUPULO-A");
    const msg = deliveryMessage({ key: "CUPULO-ABCD-EFGH-JK23", productName: "Pack", durationLabel: "7 dias", siteUrl: "https://s.com" });
    expect(msg.files).toHaveLength(1);
  });
});
