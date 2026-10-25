import { AttachmentBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from "discord.js";
import { brandEmbed, logoFile } from "../embeds.js";
import { DURATION_CHOICES, productAutocomplete } from "./shared.js";
import type { Command } from "./types.js";
import type { Duration } from "../api.js";

const MAX_IN_EMBED = 20;

export const gerarkey: Command = {
  staffOnly: true,
  data: new SlashCommandBuilder()
    .setName("gerarkey")
    .setDescription("Gera keys de um produto (só a staff vê a resposta).")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((o) => o.setName("produto").setDescription("Produto").setRequired(true).setAutocomplete(true))
    .addStringOption((o) =>
      o.setName("duracao").setDescription("Duração do acesso").setRequired(true).addChoices(...DURATION_CHOICES),
    )
    .addIntegerOption((o) =>
      o.setName("quantidade").setDescription("Quantas keys (1 a 100)").setMinValue(1).setMaxValue(100),
    ),

  autocomplete: productAutocomplete,

  async execute(interaction, { api }) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await api.generateKeys({
      product: interaction.options.getString("produto", true),
      duration: interaction.options.getString("duracao", true) as Duration,
      quantity: interaction.options.getInteger("quantidade") ?? 1,
      createdBy: interaction.user.id,
      note: `Gerada por ${interaction.user.username} via /gerarkey`,
    });

    const embed = brandEmbed()
      .setTitle(`${result.keys.length} key(s) gerada(s)`)
      .addFields(
        { name: "Produto", value: result.product.name, inline: true },
        { name: "Duração", value: result.durationLabel, inline: true },
      );
    const files = [logoFile()];
    if (result.keys.length <= MAX_IN_EMBED) {
      embed.setDescription("```\n" + result.keys.join("\n") + "\n```");
    } else {
      embed.setDescription("As keys estão no arquivo anexo.");
      files.push(
        new AttachmentBuilder(Buffer.from(result.keys.join("\n") + "\n", "utf8"), {
          name: `keys-${result.product.slug}-${result.duration}.txt`,
        }),
      );
    }
    embed.addFields({ name: "⚠️ Atenção", value: "Guarde agora: as keys não podem ser vistas de novo depois." });
    await interaction.editReply({ embeds: [embed], files });
  },
};
