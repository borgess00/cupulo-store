/** Aceita só caminhos internos ("/algo"), nunca URLs externas. */
export function safeRedirectPath(value: unknown, fallback = "/biblioteca"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.startsWith("/api/") || value.startsWith("/login")) return fallback;
  return value;
}
