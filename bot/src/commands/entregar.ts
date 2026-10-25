import { DiscordAPIError, InteractionContextType, MessageFlags, RESTJSONErrorCodes, SlashCommandBuilder } from "discord.js";
import type { Duration } from "../api.js";
import { brandEmbed, deliveryMessage, logoFile } from "../embeds.js";
import { DURATION_CHOICES, productAutocomplete } from "./shared.js";
import type { Command } from "./types.js";

export const entregar: Command = {
  staffOnly: true,
  data: new SlashCommandBuilder()
    .setName("entregar")
    .setDescription("Gera uma key e envia na DM do cliente.")
    .setContexts(InteractionContextType.Guild)
    .addUserOption((o) => o.setName("usuario").setDescription("Cliente que comprou").setRequired(true))
    .addStringOption((o) => o.setName("produto").setDescription("Produto").setRequired(true).setAutocomplete(true))
    .addStringOption((o) =>
      o.setName("duracao").setDescription("Duração do acesso").setRequired(true).addChoices(...DURATION_CHOICES),
    ),

  autocomplete: productAutocomplete,

  async execute(interaction, { api, config }) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const target = interaction.options.getUser("usuario", true);
    if (target.bot) {
      await interaction.editReply({ content: "⚠️ Não dá para entregar key para um bot." });
      return;
    }

    const result = await api.generateKeys({
      product: interaction.options.getString("produto", true),
      duration: interaction.options.getString("duracao", true) as Duration,
      quantity: 1,
      createdBy: interaction.user.id,
      note: `Entregue para ${target.username} (${target.id}) por ${interaction.user.username}`,
    });
    const key = result.keys[0]!;

    // 1) DM para o cliente
    let dmOk = true;
    try {
      await target.send(
        deliveryMessage({ key, productName: result.product.name, durationLabel: result.durationLabel, siteUrl: config.SITE_URL }),
      );
    } catch (e) {
      dmOk = false;
      if (!(e instanceof DiscordAPIError && e.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser)) {
        console.error("[entregar] falha ao enviar DM", e);
      }
    }

    // 2) Cargo "Cliente" (opcional)
    let roleNote = "";
    if (config.CLIENT_ROLE_ID && interaction.guild) {
      try {
        const member = await interaction.guild.members.fetch(target.id);
        if (!member.roles.cache.has(config.CLIENT_ROLE_ID)) {
          await member.roles.add(config.CLIENT_ROLE_ID, `Compra entregue por ${interaction.user.username}`);
          roleNote = "\n🏷️ Cargo **Cliente** adicionado.";
        }
      } catch (e) {
        console.error("[entregar] falha ao dar cargo", e);
        roleNote =
          "\n⚠️ Não consegui dar o cargo Cliente (o cliente saiu do servidor, ou o cargo do bot está abaixo do cargo Cliente).";
      }
    }

    // 3) Resposta para a staff
    const embed = brandEmbed()
      .setTitle(dmOk ? "✅ Key entregue" : "⚠️ DM fechada — entregue manualmente")
      .setColor(dmOk ? 0xf2f2f0 : 0xffb020)
      .addFields(
        { name: "Cliente", value: `${target} (${target.username})`, inline: true },
        { name: "Produto", value: result.product.name, inline: true },
        { name: "Duração", value: result.durationLabel, inline: true },
        { name: "Key", value: "```\n" + key + "\n```" },
      )
      .setDescription(
        (dmOk
          ? "A key foi enviada na DM do cliente com o passo a passo."
          : "O cliente está com as DMs fechadas. Copie a key acima e envie para ele (ticket/canal privado), " +
            `junto com o link: ${config.SITE_URL}/resgatar`) + roleNote,
      );
    await interaction.editReply({ embeds: [embed], files: [logoFile()] });

    // 4) Registro no canal de log (opcional) — sem a key completa.
    if (config.DELIVERY_LOG_CHANNEL_ID) {
      try {
        const channel = await interaction.client.channels.fetch(config.DELIVERY_LOG_CHANNEL_ID);
        if (channel?.isSendable()) {
          await channel.send({
            embeds: [
              brandEmbed()
                .setTitle("📦 Entrega registrada")
                .addFields(
                  { name: "Cliente", value: `${target}`, inline: true },
                  { name: "Produto", value: `${result.product.name} · ${result.durationLabel}`, inline: true },
                  { name: "Staff", value: `${interaction.user}`, inline: true },
                  { name: "Key", value: `\`CUPULO-••••-••••-${key.slice(-4)}\``, inline: true },
                  { name: "DM", value: dmOk ? "enviada" : "fechada (entrega manual)", inline: true },
                ),
            ],
            files: [logoFile()],
            allowedMentions: { parse: [] },
          });
        }
      } catch (e) {
        console.error("[entregar] falha ao registrar no canal de log", e);
      }
    }
  },
};
