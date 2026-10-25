import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { notifyRedemption } from "@/lib/webhook";

let server: Server;
let received: { body: Record<string, unknown> }[] = [];
let respondWith = 204;

beforeAll(async () => {
  server = createServer((req, res) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      received.push({ body: JSON.parse(data) });
      res.statusCode = respondWith;
      res.end();
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  process.env.DISCORD_WEBHOOK_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/webhook`;
});

afterAll(() => {
  delete process.env.DISCORD_WEBHOOK_URL;
  server.close();
});

const evento = {
  user: { discordId: "200000000000000002", name: "Cliente", avatar: null },
  product: { name: "Pack Android", slug: "pack-android" },
  durationLabel: "30 dias",
  expiresAt: new Date("2026-11-24T18:00:00Z"),
  lifetime: false,
};

describe("webhook de resgate", () => {
  it("envia embed com cliente, produto e data, sem pingar ninguém", async () => {
    received = [];
    await notifyRedemption(evento);
    expect(received).toHaveLength(1);
    const body = received[0]!.body as { embeds: { fields: { name: string; value: string }[] }[]; allowed_mentions: unknown };
    expect(body.allowed_mentions).toEqual({ parse: [] });
    const fields = Object.fromEntries(body.embeds[0]!.fields.map((f) => [f.name, f.value]));
    expect(fields.Cliente).toContain("<@200000000000000002>");
    expect(fields.Produto).toBe("Pack Android");
    expect(fields["Acesso até"]).toMatch(/^<t:\d+:f>$/);
  });

  it("falha do Discord não lança erro (o resgate continua valendo)", async () => {
    respondWith = 500;
    await expect(notifyRedemption({ ...evento, lifetime: true })).resolves.toBeUndefined();
    process.env.DISCORD_WEBHOOK_URL = "http://127.0.0.1:1/fechado";
    await expect(notifyRedemption(evento)).resolves.toBeUndefined();
  });
});
