import { type Interaction, MessageFlags } from "discord.js";
import { ApiError } from "./api.js";
import { commandMap } from "./commands/index.js";
import type { BotContext } from "./commands/types.js";
import { errorEmbed } from "./embeds.js";

type MemberLike = { roles: string[] | { cache: { has(id: string): boolean } } } | null;

/** Confere se o membro tem algum cargo de staff (funciona com membro em cache ou cru da API). */
export function hasStaffRole(member: MemberLike, staffRoleIds: string[]): boolean {
  if (!member) return false;
  const roles = member.roles;
  if (Array.isArray(roles)) return roles.some((r) => staffRoleIds.includes(r));
  return staffRoleIds.some((id) => roles.cache.has(id));
}

export async function handleInteraction(interaction: Interaction, ctx: BotContext): Promise<void> {
  if (interaction.isAutocomplete()) {
    const cmd = commandMap.get(interaction.commandName);
    if (!cmd?.autocomplete) return;
    if (cmd.staffOnly && !hasStaffRole(interaction.member as MemberLike, ctx.config.STAFF_ROLE_IDS)) {
      await interaction.respond([]);
      return;
    }
    await cmd.autocomplete(interaction, ctx).catch((e) => console.error("[autocomplete]", e));
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const cmd = commandMap.get(interaction.commandName);
  if (!cmd) return;

  if (cmd.staffOnly) {
    const inGuild = interaction.guildId === ctx.config.DISCORD_GUILD_ID;
    if (!inGuild || !hasStaffRole(interaction.member as MemberLike, ctx.config.STAFF_ROLE_IDS)) {
      await interaction.reply({
        embeds: [errorEmbed("Este comando é só para a staff.")],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  try {
    await cmd.execute(interaction, ctx);
  } catch (e) {
    const message = e instanceof ApiError ? e.message : "Algo deu errado. Tente de novo em instantes.";
    if (!(e instanceof ApiError)) console.error(`[/${interaction.commandName}]`, e);
    const payload = { embeds: [errorEmbed(message)], content: "", files: [], components: [] };
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply(payload);
      else await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
    } catch {
      // A interação pode ter expirado; nada mais a fazer.
    }
  }
}
