import { fileURLToPath } from "node:url";
import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import type { KeyInfo, UserAccesses } from "./api.js";

// Mesmo visual do site: preto e branco, com o logo.
export const BRAND_COLOR = 0xf2f2f0;
export const DANGER_COLOR = 0xff5c5c;
const LOGO = "attachment://logo.png";

export function logoFile() {
  return new AttachmentBuilder(fileURLToPath(new URL("../assets/logo.png", import.meta.url)), { name: "logo.png" });
}

export function brandEmbed() {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setAuthor({ name: "CUPULO STORE", iconURL: LOGO })
    .setFooter({ text: "CUPULO STORE · Sua sensibilidade, do seu jeito", iconURL: LOGO })
    .setTimestamp();
}

export function errorEmbed(message: string) {
  return new EmbedBuilder().setColor(DANGER_COLOR).setDescription(`⚠️ ${message}`);
}

const ts = (iso: string, style: "f" | "R" | "d" = "f") => `<t:${Math.floor(new Date(iso).getTime() / 1000)}:${style}>`;

export function redeemUrl(siteUrl: string, key?: string) {
  return key ? `${siteUrl}/resgatar?key=${encodeURIComponent(key)}` : `${siteUrl}/resgatar`;
}

/** DM que o cliente recebe com a key. */
export function deliveryMessage(opts: { key: string; productName: string; durationLabel: string; siteUrl: string }) {
  const embed = brandEmbed()
    .setTitle("🔑 Sua key chegou!")
    .setThumbnail(LOGO)
    .setDescription(
      [
        `Obrigado pela compra! Aqui está a sua key do **${opts.productName}**:`,
        "```",
        opts.key,
        "```",
      ].join("\n"),
    )
    .addFields(
      { name: "Produto", value: opts.productName, inline: true },
      { name: "Duração", value: opts.durationLabel, inline: true },
      {
        name: "Como resgatar",
        value: [
          "**1.** Toque em **Resgatar agora** aqui embaixo.",
          "**2.** Entre com a sua conta do Discord.",
          "**3.** A key já vem preenchida: é só tocar em **Resgatar key**.",
          "**4.** Pronto! O produto aparece na sua **biblioteca**.",
        ].join("\n"),
      },
      {
        name: "Importante",
        value:
          "• O tempo começa a contar **quando você resgatar**.\n• A key vale **uma única vez** e fica presa à conta que resgatar. Não compartilhe.",
      },
    );
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Resgatar agora").setEmoji("🔑").setURL(redeemUrl(opts.siteUrl, opts.key)),
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Abrir site").setURL(opts.siteUrl),
  );
  return { embeds: [embed], components: [row], files: [logoFile()] };
}

export function redeemHelpMessage(siteUrl: string) {
  const embed = brandEmbed()
    .setTitle("Como resgatar sua key")
    .setThumbnail(LOGO)
    .setDescription(
      [
        "**1.** Compre seu pack aqui no servidor e receba a key na DM.",
        `**2.** Acesse **${siteUrl.replace(/^https?:\/\//, "")}** e toque em **Entrar com Discord**.`,
        "**3.** Vá em **Resgatar key** e cole o código `CUPULO-XXXX-XXXX-XXXX`.",
        "**4.** O produto é liberado na hora na sua **biblioteca**: assista ao tutorial e baixe os arquivos.",
        "",
        "Se tiver qualquer problema, abra um ticket com a staff.",
      ].join("\n"),
    );
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Resgatar key").setEmoji("🔑").setURL(redeemUrl(siteUrl)),
    new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Minha biblioteca").setURL(`${siteUrl}/biblioteca`),
  );
  return { embeds: [embed], components: [row], files: [logoFile()] };
}

const STATUS_LABEL = { AVAILABLE: "🟢 Disponível", REDEEMED: "⚪ Resgatada", REVOKED: "🔴 Revogada" } as const;
const ACCESS_LABEL = { lifetime: "Vitalício", active: "Ativo", expired: "Expirado" } as const;

export function keyStatusEmbed(info: KeyInfo) {
  const e = brandEmbed()
    .setTitle("Consulta de key")
    .addFields(
      { name: "Key", value: `\`${info.masked}\``, inline: false },
      { name: "Status", value: STATUS_LABEL[info.status], inline: true },
      { name: "Produto", value: info.product.name, inline: true },
      { name: "Duração", value: info.durationLabel, inline: true },
      { name: "Gerada", value: `${ts(info.createdAt)} por <@${info.createdBy}>`, inline: false },
    );
  if (info.note) e.addFields({ name: "Observação", value: info.note.slice(0, 1000) });
  if (info.redemption) {
    const r = info.redemption;
    const acesso = r.access
      ? r.access.status === "lifetime"
        ? "Vitalício"
        : r.access.expiresAt
          ? `${ACCESS_LABEL[r.access.status]} até ${ts(r.access.expiresAt)} (${ts(r.access.expiresAt, "R")})`
          : ACCESS_LABEL[r.access.status]
      : "—";
    e.addFields(
      { name: "Resgatada por", value: `<@${r.user.discordId}> (${r.user.name})`, inline: true },
      { name: "Resgatada em", value: ts(r.redeemedAt), inline: true },
      { name: "Acesso do cliente", value: acesso, inline: false },
    );
  }
  if (info.status === "REVOKED") {
    e.setColor(DANGER_COLOR).addFields({
      name: "Revogada",
      value: `${info.revokedAt ? ts(info.revokedAt) : ""}${info.revokeReason ? ` — ${info.revokeReason}` : ""}` || "—",
    });
  }
  return e;
}

export function accessesEmbed(target: { id: string; username: string }, data: UserAccesses) {
  const e = brandEmbed().setTitle(`Acessos de ${target.username}`);
  if (!data.user) {
    return e.setDescription(`<@${target.id}> ainda não entrou no site (nenhum resgate).`);
  }
  const ativos = data.accesses.filter((a) => a.status !== "expired");
  const expirados = data.accesses.filter((a) => a.status === "expired");
  const linhas = ativos.map((a) =>
    a.status === "lifetime"
      ? `• **${a.product.name}** — vitalício`
      : `• **${a.product.name}** — até ${ts(a.expiresAt!)} (${ts(a.expiresAt!, "R")})`,
  );
  e.setDescription(
    [
      `<@${target.id}>${data.user.banned ? " · 🚫 **bloqueado no site**" : ""}`,
      "",
      ativos.length ? "**Produtos ativos**" : "_Nenhum produto ativo._",
      ...linhas,
    ].join("\n"),
  );
  if (expirados.length) {
    e.addFields({ name: "Expirados", value: expirados.map((a) => a.product.name).join(", ").slice(0, 1000) });
  }
  e.addFields(
    { name: "No site desde", value: ts(data.user.createdAt, "d"), inline: true },
    { name: "Último login", value: ts(data.user.lastLoginAt, "R"), inline: true },
  );
  return e;
}
