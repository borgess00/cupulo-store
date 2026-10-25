// Dados públicos do site (podem ir para o navegador).
export const site = {
  name: "CUPULO STORE",
  slogan: "Sua sensibilidade, do seu jeito",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  discordInvite: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? "#",
};

export const SENSI_PRODUCT_SLUG = "gerador-sensi-ios";
