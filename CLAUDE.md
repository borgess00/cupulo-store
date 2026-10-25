# CUPULO STORE

- Dono / GitHub: `borgess00` — repositório `borgess00/cupulo-store`.
- Loja de produtos digitais para Free Fire. Venda no Discord → bot entrega KEY → cliente resgata no site.
- Monorepo: `web/` (Next.js 16 + Prisma 7 + Auth.js v5 + Supabase) e `bot/` (discord.js v14). O bot só fala com o site pela API `/api/bot/*`.
- Todo texto do site e do bot em português do Brasil. Documentação completa no `README.md`.

## Decisões aprovadas
- Banco e arquivos: Supabase (Postgres + Storage: bucket `packs` privado com links assinados, `imagens` público).
- Keys: `CUPULO-XXXX-XXXX-XXXX`, alfabeto sem 0/O/1/I, guardadas só como HMAC-SHA256 (`KEY_PEPPER`). Não vencem; só deixam de valer se revogadas.
- Revogar key já resgatada remove o tempo que ela concedeu (vitalícia: mantém o tempo das temporárias).
- Tempo soma: `max(agora, fimAtual) + duração`; vitalícia vence tudo.
- Rate limit do resgate no próprio Postgres (5/min por usuário e por IP).
- Bot só DÁ o cargo "Cliente" (não remove).
- Gerador de Sensi: tabela e fórmula editáveis em `web/src/lib/sensi/`.
- Visual: streetwear grunge preto e branco (inspiração: site do Canto do Nunez).
- Admins (ADMIN_DISCORD_IDS) pré-visualizam qualquer produto.

## Status
Etapas 1–6 concluídas (setup, keys + API, páginas, admin, bot, revisão final).

## Convenções importantes (Next 16)
- `cacheComponents` ligado: leitura de sessão/banco/searchParams fica dentro de `<Suspense>`; use `getSession()`/`requireUser()` de `lib/session.ts` (chamam `connection()` antes do auth).
- `proxy.ts` (antigo middleware) é só a primeira barreira; sempre conferir acesso no servidor.
- Importe `z` de `@/lib/zod` (mensagens pt-BR). Forms com action usam `submitWithoutReset` (`lib/form.ts`).
- Actions do admin: `requireAdmin()` + Zod + `audit()` + `refresh()`/`updateTag(PRODUCTS_TAG)`.

## Comandos
- Site (`web/`): `npm run dev | build | lint | typecheck | test`, `npm run db:migrate | db:deploy | db:seed`.
  Testes usam Postgres de teste (`TEST_DATABASE_URL`, nome precisa conter "test").
- Bot (`bot/`): `npm run dev | build | start | deploy-commands | lint | typecheck | test`.
