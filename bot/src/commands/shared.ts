import type { AutocompleteInteraction } from "discord.js";
import type { Duration } from "../api.js";
import type { BotContext } from "./types.js";

export const DURATION_CHOICES: { name: string; value: Duration }[] = [
  { name: "7 dias", value: "7d" },
  { name: "30 dias", value: "30d" },
  { name: "Vitalícia", value: "lifetime" },
];

/** Autocomplete do campo "produto": busca por nome ou slug. */
export async function productAutocomplete(interaction: AutocompleteInteraction, { api }: BotContext) {
  const typed = interaction.options.getFocused().toString().toLowerCase();
  try {
    const products = await api.listProducts();
    const matches = products
      .filter((p) => p.name.toLowerCase().includes(typed) || p.slug.includes(typed))
      .slice(0, 25)
      .map((p) => ({ name: `${p.name}${p.active ? "" : " (oculto)"}`, value: p.slug }));
    await interaction.respond(matches);
  } catch {
    await interaction.respond([]);
  }
}
