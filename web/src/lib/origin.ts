import "server-only";

/**
 * Defesa CSRF para rotas POST do site chamadas pelo navegador:
 * o Origin precisa ser o próprio site.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host && o.host === host) return true;
    const site = process.env.NEXT_PUBLIC_SITE_URL;
    return !!site && o.origin === new URL(site).origin;
  } catch {
    return false;
  }
}
