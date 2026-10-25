// Testa os comandos contra um site de verdade (sem conectar no Discord).
// Uso: SITE_URL=http://localhost:3000 BOT_API_TOKEN=... npx tsx scripts/smoke-site.ts
import { SiteApi } from "../src/api.js";
import { handleInteraction } from "../src/handler.js";
import { config as base, embedsJson, fakeInteraction, fakeUser } from "../tests/fakes.js";

const config = { ...base, SITE_URL: process.env.SITE_URL!, BOT_API_TOKEN: process.env.BOT_API_TOKEN! };
const ctx = { config, api: new SiteApi(config.SITE_URL, config.BOT_API_TOKEN) };
const show = (label: string, payload: unknown) =>
  console.log(`\n── ${label}\n`, JSON.stringify(embedsJson(payload).map((e) => ({ title: e.title, description: e.description, fields: e.fields })), null, 1).slice(0, 1400));

const products = await ctx.api.listProducts();
console.log("produtos:", products.map((p) => p.slug).join(", "));

const g = fakeInteraction("gerarkey", { produto: "pack-iphone", duracao: "7d", quantidade: 3 });
await handleInteraction(g.interaction as never, ctx);
show("/gerarkey pack-iphone 7d x3", g.state.edits[0]);

const cliente = fakeUser("200000000000000002", "Cliente");
const e = fakeInteraction("entregar", { usuario: cliente, produto: "otimizacao-ios", duracao: "lifetime" });
await handleInteraction(e.interaction as never, ctx);
show("/entregar", e.state.edits[0]);
const dmKey = JSON.stringify(embedsJson(cliente.sent[0])).match(/CUPULO-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/)![0];
console.log("key na DM:", dmKey, "| cargo dado:", e.rolesAdded);

const c = fakeInteraction("consultarkey", { key: dmKey.toLowerCase() });
await handleInteraction(c.interaction as never, ctx);
show("/consultarkey", c.state.edits[0]);

const a = fakeInteraction("acessos", { usuario: { id: "200000000000000002", username: "Cliente" } });
await handleInteraction(a.interaction as never, ctx);
show("/acessos", a.state.edits[0]);

const n = fakeInteraction("consultarkey", { key: "CUPULO-AAAA-BBBB-CCCC" });
await handleInteraction(n.interaction as never, ctx);
show("/consultarkey inexistente", n.state.edits[0]);
