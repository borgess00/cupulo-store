// Helpers puros do Discord (podem ser usados no servidor e no navegador).

/** URL do avatar no CDN do Discord (ou o avatar padrão quando não há). */
export function discordAvatarUrl(discordId: string, avatarHash: string | null | undefined, size = 128): string {
  if (avatarHash) {
    const ext = avatarHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${ext}?size=${size}`;
  }
  let index = 0;
  if (/^\d+$/.test(discordId)) index = Number((BigInt(discordId) >> BigInt(22)) % BigInt(6));
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}
