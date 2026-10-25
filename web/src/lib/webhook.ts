import "server-only";
import { discordAvatarUrl } from "@/lib/discord";
import { site } from "@/lib/site";

type RedeemEvent = {
  user: { discordId: string; name: string; avatar: string | null };
  product: { name: string; slug: string };
  durationLabel: string;
  expiresAt: Date | null;
  lifetime: boolean;
};

/** Avisa o canal da staff que uma key foi resgatada. Nunca derruba o resgate. */
export async function notifyRedemption(e: RedeemEvent) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;
  const ate = e.lifetime
    ? "Vitalício"
    : e.expiresAt
      ? `<t:${Math.floor(e.expiresAt.getTime() / 1000)}:f>`
      : "—";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify({
        username: "CUPULO STORE",
        avatar_url: `${site.url}/logo.png`,
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: "🔑 Key resgatada",
            color: 0xf2f2f0,
            thumbnail: { url: discordAvatarUrl(e.user.discordId, e.user.avatar) },
            fields: [
              { name: "Cliente", value: `<@${e.user.discordId}> (${e.user.name})`, inline: false },
              { name: "Produto", value: e.product.name, inline: true },
              { name: "Duração", value: e.durationLabel, inline: true },
              { name: "Acesso até", value: ate, inline: true },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "CUPULO STORE" },
          },
        ],
      }),
    });
    if (!res.ok) console.error("[webhook] Discord respondeu", res.status);
  } catch (err) {
    console.error("[webhook] falhou", err);
  }
}
