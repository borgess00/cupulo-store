# CUPULO STORE

- Dono / GitHub: `borgess00` — repositório `borgess00/cupulo-store`.
- Loja de produtos digitais para Free Fire. Venda no Discord → bot entrega KEY → cliente resgata no site.
- Monorepo: `web/` (Next.js + Prisma + Auth.js + Supabase) e `bot/` (discord.js v14). O bot só fala com o site pela API `/api/bot/*`.
- Todo texto do site e do bot em português do Brasil.

## Decisões aprovadas
- Banco e arquivos: Supabase (Postgres + Storage privado, links assinados).
- Keys: `CUPULO-XXXX-XXXX-XXXX`, alfabeto sem 0/O/1/I, guardadas só como HMAC-SHA256. Não vencem; só deixam de valer se revogadas.
- Revogar key já resgatada remove o tempo que ela concedeu.
- Tempo soma: `max(agora, fimAtual) + duração`; vitalícia vence tudo.
- Rate limit do resgate no próprio Postgres.
- Bot só DÁ o cargo "Cliente" (não remove).
- Gerador de Sensi: tabela editável em `web/src/lib/sensi/`.
- Visual: streetwear grunge preto e branco (inspiração: site do Canto do Nunez).

## Forma de trabalho
Etapas: 1 setup/auth/prisma · 2 keys + API bot · 3 páginas do usuário · 4 admin · 5 bot · 6 revisão.
Cada etapa termina com build + lint + testes + resumo para o dono.
