// Formato, geração e hash das keys.
// Formato: CUPULO-XXXX-XXXX-XXXX, sem caracteres ambíguos (0/O, 1/I).
import { createHmac, randomInt } from "node:crypto";

export const KEY_PREFIX = "CUPULO";
export const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const GROUPS = 3;
const GROUP_SIZE = 4;
const BODY_LENGTH = GROUPS * GROUP_SIZE;
const BODY_RE = new RegExp(`^[${KEY_ALPHABET}]{${BODY_LENGTH}}$`);

/** Gera uma key nova com CSPRNG (~60 bits de entropia). */
export function generateKey(): string {
  let body = "";
  for (let i = 0; i < BODY_LENGTH; i++) body += KEY_ALPHABET[randomInt(KEY_ALPHABET.length)];
  return formatBody(body);
}

function formatBody(body: string): string {
  const groups = body.match(new RegExp(`.{${GROUP_SIZE}}`, "g")) ?? [];
  return [KEY_PREFIX, ...groups].join("-");
}

/**
 * Normaliza o que o cliente digitou/colou: ignora espaços, traços e caixa,
 * aceita com ou sem o prefixo. Retorna a key canônica ou null se inválida.
 */
export function normalizeKey(input: string): string | null {
  if (typeof input !== "string" || input.length > 64) return null;
  let s = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.startsWith(KEY_PREFIX)) s = s.slice(KEY_PREFIX.length);
  if (!BODY_RE.test(s)) return null;
  return formatBody(s);
}

/** HMAC-SHA256 da key canônica com o segredo KEY_PEPPER. */
export function hashKey(canonicalKey: string, pepper = process.env.KEY_PEPPER): string {
  if (!pepper || pepper.length < 32) throw new Error("KEY_PEPPER ausente ou curto demais");
  return createHmac("sha256", pepper).update(canonicalKey).digest("hex");
}

export function keyLast4(canonicalKey: string): string {
  return canonicalKey.slice(-4);
}

/** Versão mascarada para exibir: CUPULO-••••-••••-AB7K */
export function maskKey(last4: string): string {
  return `${KEY_PREFIX}-••••-••••-${last4}`;
}
