// Cliente da API do site (/api/bot/*). O bot nunca acessa o banco diretamente.

export type Duration = "7d" | "30d" | "lifetime";

export type Product = { id: string; slug: string; name: string; active: boolean; platform: string };

export type KeyInfo = {
  id: string;
  masked: string;
  status: "AVAILABLE" | "REDEEMED" | "REVOKED";
  duration: Duration;
  durationLabel: string;
  product: { id: string; slug: string; name: string };
  createdAt: string;
  createdBy: string;
  note: string | null;
  revokedAt: string | null;
  revokeReason: string | null;
  redemption: null | {
    redeemedAt: string;
    user: { discordId: string; name: string };
    access: { status: "lifetime" | "active" | "expired"; expiresAt: string | null } | null;
  };
};

export type UserAccesses = {
  user: null | { discordId: string; name: string; banned: boolean; createdAt: string; lastLoginAt: string };
  accesses: {
    product: { slug: string; name: string };
    status: "lifetime" | "active" | "expired";
    lifetime: boolean;
    expiresAt: string | null;
  }[];
};

export type GeneratedKeys = {
  product: { id: string; slug: string; name: string };
  duration: Duration;
  durationLabel: string;
  batchId: string;
  keys: string[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export class SiteApi {
  private productCache: { at: number; data: Product[] } | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}/api/bot${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          ...init?.headers,
        },
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new ApiError("Não consegui falar com o site. Ele está no ar?", 0);
    }
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      if (res.status === 401) throw new ApiError("O site recusou o token do bot (BOT_API_TOKEN diferente?).", 401);
      throw new ApiError(body.error ?? `Erro do site (HTTP ${res.status}).`, res.status);
    }
    return body as T;
  }

  /** Produtos (cache de 60 s para o autocomplete ficar rápido). */
  async listProducts(): Promise<Product[]> {
    if (this.productCache && Date.now() - this.productCache.at < 60_000) return this.productCache.data;
    const { products } = await this.request<{ products: Product[] }>("/products");
    this.productCache = { at: Date.now(), data: products };
    return products;
  }

  generateKeys(input: { product: string; duration: Duration; quantity: number; createdBy: string; note?: string }) {
    return this.request<GeneratedKeys>("/keys", { method: "POST", body: JSON.stringify(input) });
  }

  /** null quando a key não existe. */
  async getKey(key: string): Promise<KeyInfo | null> {
    try {
      const { key: info } = await this.request<{ key: KeyInfo }>(`/keys/${encodeURIComponent(key.trim())}`);
      return info;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  }

  getUserAccesses(discordId: string) {
    return this.request<UserAccesses>(`/users/${encodeURIComponent(discordId)}`);
  }
}
