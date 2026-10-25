# CUPULO STORE

Loja de produtos digitais para Free Fire com **área de membros** e **bot do Discord**.

```
Cliente compra no Discord ──► staff usa /entregar ──► bot manda a KEY na DM
        │
        ▼
Site: Entrar com Discord ──► Resgatar key ──► produto liberado na Biblioteca
                                               (tutorial, vídeo, downloads, gerador de sensi)
```

| Pasta | O que é |
|---|---|
| [`web/`](web) | Site (Next.js 16, Tailwind, Auth.js, Prisma, Supabase): landing, área do cliente, painel admin e a API do bot |
| [`bot/`](bot) | Bot do Discord (discord.js v14). Fala com o site **só** pela API protegida. Instruções em [`bot/README.md`](bot/README.md) |

---

## Sumário
1. [Visão geral](#1-visão-geral)
2. [Rodar no seu computador](#2-rodar-no-seu-computador)
3. [Configurar o Discord (login e webhook)](#3-configurar-o-discord-login-e-webhook)
4. [Configurar o Supabase (banco e arquivos)](#4-configurar-o-supabase-banco-e-arquivos)
5. [Colocar o site no ar (Vercel)](#5-colocar-o-site-no-ar-vercel)
6. [Colocar o bot no ar](#6-colocar-o-bot-no-ar)
7. [Operação do dia a dia](#7-operação-do-dia-a-dia)
8. [Segurança](#8-segurança)
9. [Testes](#9-testes)
10. [✅ Checklist para colocar no ar](#10--checklist-para-colocar-no-ar)

---

## 1. Visão geral

### Páginas do site
| Rota | Quem acessa | O que tem |
|---|---|---|
| `/` | Todos | Hero com o logo, vitrine dos produtos, "Como funciona", FAQ e botão do Discord |
| `/login` | Todos | Entrar com Discord (única forma de login) |
| `/resgatar` | Logado | Campo de key com formatação automática e animação de "LIBERADO". Aceita `?key=` (link da DM) |
| `/biblioteca` | Logado | Produtos liberados, contador de tempo restante, ativo/expirado |
| `/produto/[slug]` | Com acesso ativo | Vídeo, tutorial, downloads (link assinado de 5 min) e changelog |
| `/gerador-sensi` | Com acesso ao Gerador | Sensi para Geral, Ponto Vermelho, 2x, 4x, AWM e Olhadinha |
| `/perfil` | Logado | Avatar e nome do Discord, histórico de keys |
| `/termos` | Todos | Termos de uso e privacidade (LGPD) |
| `/admin` | IDs em `ADMIN_DISCORD_IDS` | Dashboard, produtos (com upload), keys, usuários, log de downloads |

### Regras das keys
- Formato `CUPULO-XXXX-XXXX-XXXX`, sem caracteres que se confundem (0/O, 1/I).
- Cada key vale para **um produto** e uma duração: **7 dias**, **30 dias** ou **vitalícia**.
- O tempo começa no **resgate**. Resgatar outra key do mesmo produto **soma** o tempo. Se o acesso já expirou, a nova key conta a partir de agora.
- A key fica presa à conta que resgatou e **não pode ser usada de novo**.
- Keys não vencem: só deixam de valer se forem **revogadas**. Revogar uma key já resgatada **tira do cliente o tempo que ela deu**.
- No banco fica só o **hash** (HMAC-SHA256) da key. Por isso, ela só aparece **uma vez**, na hora em que é gerada.
- Resgate limitado a **5 tentativas por minuto** por conta e por IP.

### API do bot
Todas as rotas exigem `Authorization: Bearer <BOT_API_TOKEN>`.

| Método e rota | Uso |
|---|---|
| `GET /api/bot/products` | Lista produtos (autocomplete do bot) |
| `POST /api/bot/keys` | Gera keys: `{ "product": "pack-android", "duration": "7d" \| "30d" \| "lifetime", "quantity": 1, "createdBy": "<id discord>", "note": "opcional" }` |
| `GET /api/bot/keys/:key` | Status de uma key |
| `GET /api/bot/users/:discordId` | Acessos de um cliente |

Cada resgate também gera um aviso no canal do Discord configurado em `DISCORD_WEBHOOK_URL`.

---

## 2. Rodar no seu computador

**Pré-requisitos:** Node.js 20.9 ou mais novo (recomendado: 22) e um PostgreSQL. Pode ser o do Supabase ou um local.

```bash
cd web
cp .env.example .env          # preencha (veja as seções 3 e 4)
npm install                   # também gera o Prisma Client
npm run db:deploy             # cria as tabelas
npm run db:seed               # cadastra os 9 produtos
npm run dev                   # http://localhost:3000
```

Atalhos para desenvolver:
- Com `AUTH_DEV_LOGIN="true"` no `.env`, a página `/login` ganha um **login de teste** (sem Discord). Ele só existe no `npm run dev`; em produção é desligado automaticamente.
- Sem as variáveis `SUPABASE_*`, os arquivos ficam na pasta `web/.storage/`, com o mesmo esquema de links assinados. Isso também só funciona em desenvolvimento.
- Para entrar no `/admin`, coloque o seu ID do Discord (ou o ID do login de teste) em `ADMIN_DISCORD_IDS`.

Comandos úteis em `web/`:

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run lint` / `npm run typecheck` / `npm test` | Qualidade e testes |
| `npm run db:migrate` | Cria uma migration nova depois de mudar o `schema.prisma` |
| `npm run db:deploy` | Aplica as migrations no banco do `.env` |
| `npm run db:seed` | Cadastra/garante os produtos iniciais (não apaga nada) |
| `npm run db:studio` | Abre o Prisma Studio para ver o banco |

---

## 3. Configurar o Discord (login e webhook)

### 3.1 Aplicação para o login
1. Acesse <https://discord.com/developers/applications> → **New Application** → dê o nome "CUPULO STORE".
2. Em **OAuth2**:
   - copie o **Client ID** para `AUTH_DISCORD_ID`;
   - clique em **Reset Secret** e copie o valor para `AUTH_DISCORD_SECRET`;
   - em **Redirects**, adicione as duas URLs:
     ```
     http://localhost:3000/api/auth/callback/discord
     https://SEU-DOMINIO/api/auth/callback/discord
     ```
3. Gere o `AUTH_SECRET` com `npx auth secret` ou `openssl rand -base64 33`.

O login pede só o escopo `identify` (ID, nome e avatar). O site **não** recebe o e-mail nem a senha do cliente.

### 3.2 Webhook de resgates (opcional, recomendado)
No canal da staff: **Editar canal → Integrações → Webhooks → Novo webhook → Copiar URL**. Cole em `DISCORD_WEBHOOK_URL`.

### 3.3 Administradores
Ative o **Modo desenvolvedor** no Discord, clique com o botão direito no seu perfil → **Copiar ID** e coloque em `ADMIN_DISCORD_IDS` (separe vários com vírgula).

---

## 4. Configurar o Supabase (banco e arquivos)

1. Crie um projeto em <https://supabase.com>. A região **South America (São Paulo)** deixa o site mais rápido no Brasil.
2. **Banco.** Clique em **Connect** (topo) e copie as duas strings:
   - **Transaction pooler** (porta **6543**) → `DATABASE_URL`
   - **Session pooler** (porta **5432**) → `DIRECT_URL`, usada para criar as tabelas

   Troque `[YOUR-PASSWORD]` pela senha do banco.
3. **Arquivos.** Em **Storage**, crie dois buckets:
   - `packs` → **Private** (desmarque *Public bucket*). Guarda os arquivos dos packs, que só são baixados com link assinado.
   - `imagens` → **Public**. Guarda as capas dos produtos.

   Nas configurações de cada bucket, defina o limite de tamanho. No plano gratuito o máximo é **50 MB por arquivo**.
4. **Chaves.** Em **Project Settings → API Keys**, copie a URL do projeto para `SUPABASE_URL` e a chave **service_role/secret** para `SUPABASE_SERVICE_ROLE_KEY`. Essa chave é secreta: só vai no servidor (Vercel), nunca no navegador.
5. **Data API (recomendado).** O site não usa a API REST do Supabase. Em **Project Settings → Data API**, desative-a ou remova `public` dos *Exposed schemas*. Mesmo que fique ligada, as tabelas já são criadas com **RLS ativado e sem políticas** (migration `seguranca_rls`), então ninguém lê nada por ela.
6. Crie as tabelas e os produtos a partir do seu computador, com o `.env` apontando para o Supabase:
   ```bash
   cd web && npm run db:deploy && npm run db:seed
   ```
   Na Vercel, as migrations também rodam sozinhas a cada deploy.

---

## 5. Colocar o site no ar (Vercel)

1. Em <https://vercel.com/new>, importe o repositório `borgess00/cupulo-store`.
2. **Root Directory:** `web`. O framework (Next.js) é detectado sozinho.
3. Não mexa no build. O projeto tem um script `vercel-build` que roda `prisma generate`, depois `prisma migrate deploy` e por fim `next build`.
4. Em **Environment Variables**, cadastre **todas** as variáveis do [`web/.env.example`](web/.env.example), **exceto** `AUTH_DEV_LOGIN`.
   - `NEXT_PUBLIC_SITE_URL` = a URL final do site (ex.: `https://cupulostore.com.br`)
   - `NEXT_PUBLIC_DISCORD_INVITE_URL` = o convite do seu servidor
   - `KEY_PEPPER` e `BOT_API_TOKEN`: gere cada um com `openssl rand -hex 32`. **Nunca troque o `KEY_PEPPER` depois de gerar keys**, senão as keys antigas param de funcionar.
5. Clique em **Deploy**.
6. Se usar domínio próprio, configure em **Settings → Domains** e depois:
   - atualize `NEXT_PUBLIC_SITE_URL` e faça um novo deploy;
   - adicione `https://SEU-DOMINIO/api/auth/callback/discord` nos Redirects do Discord (seção 3.1).

---

## 6. Colocar o bot no ar

Siga o passo a passo completo em [`bot/README.md`](bot/README.md). Em resumo:
1. Ative o bot na mesma aplicação do Discord, copie o token e convide-o para o servidor com a permissão **Gerenciar cargos**.
2. Preencha o `bot/.env`. O `BOT_API_TOKEN` é **o mesmo** do site, e o `SITE_URL` é a URL do site.
3. `npm install && npm run build && npm run deploy-commands && npm start`. Para ficar 24h no ar, use Railway, Discloud ou uma VPS.

---

## 7. Operação do dia a dia

| Situação | Como fazer |
|---|---|
| **Cliente pagou** | No Discord: `/entregar usuario:@cliente produto:… duracao:…`. O cliente recebe a key na DM com o botão **Resgatar agora**. |
| Cliente com DM fechada | O `/entregar` avisa e mostra a key para a staff mandar por ticket. |
| Gerar keys para sorteio/revenda | `/gerarkey` (até 100) ou **Admin → Keys** (até 500, exporta `.txt`/`.csv`). Guarde na hora: elas não aparecem de novo. |
| "Minha key não funciona" | `/consultarkey key:…` ou busque a key em **Admin → Keys**. Mostra se já foi usada, por quem e até quando vale. |
| Renovação | É só entregar uma nova key do mesmo produto: o tempo soma. |
| Estorno, fraude ou compartilhamento | **Admin → Keys → Revogar**, que tira o tempo dado pela key. Também dá para remover o acesso ou **bloquear** o usuário em **Admin → Usuários**. |
| Brinde ou compensação | **Admin → Usuários → (cliente) → Conceder**: +7, +30, dias personalizados ou vitalício. |
| Atualizar um pack | **Admin → Produtos → (produto)**: envie o arquivo novo (com versão), apague o antigo e adicione uma entrada no changelog. |
| Mudar textos, vídeo ou tutorial | **Admin → Produtos**. O tutorial aceita markdown. |
| Esconder um produto | Desmarque **Ativo**. Quem já tem acesso continua acessando. |
| Ajustar o Gerador de Sensi | Edite `web/src/lib/sensi/calculo.ts` (valores base, pesos e estilos) e `web/src/lib/sensi/aparelhos.ts` (lista de iPhones). Faça commit: a Vercel publica sozinha. |
| Editar Termos, FAQ ou textos da home | `web/src/app/termos/page.tsx` e `web/src/app/page.tsx`. |

---

## 8. Segurança

O que já está implementado:
- **Toda** página de produto, download, ferramenta, action e rota do admin confere a sessão e o acesso **no servidor**. O proxy (`src/proxy.ts`) é só a primeira barreira.
- Arquivos em bucket **privado**. O download usa link assinado de **5 minutos**, gerado só com acesso ativo, e fica registrado no log.
- Keys guardadas só como **HMAC-SHA256**, com o segredo `KEY_PEPPER`. O resgate é transacional: duas pessoas nunca resgatam a mesma key, e resgates simultâneos somam o tempo certo.
- Rate limit no Postgres: resgate 5/min por conta e por IP; download 20/min por conta.
- Proteção CSRF: Auth.js no login, verificação de Origin nas rotas POST e a proteção nativa das Server Actions.
- Validação com **Zod** em todas as entradas (site, API e bot).
- Headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy e Permissions-Policy.
- API do bot com token comparado em tempo constante.
- RLS ligado em todas as tabelas (Supabase Data API).
- IPs guardados só como hash (LGPD). O login não pede e-mail.
- Conta bloqueada perde a sessão na hora e não consegue resgatar nem baixar.
- Nenhum segredo vai para o navegador nem para o repositório: os arquivos `.env` estão no `.gitignore`.

Pontos para saber:
- O link da DM (`/resgatar?key=…`) leva a key na URL para preencher sozinho. O site tira a key da barra de endereço na hora, mas ela pode aparecer nos logs de acesso da Vercel. Como cada key vale uma única vez, o risco é baixo.
- A CSP permite scripts inline, como o Next.js exige sem renderização por nonce.
- Os Termos de Uso são um modelo. Vale revisar com um profissional antes de publicar.

---

## 9. Testes

```bash
# Site: 59 testes (keys, resgate, concorrência, revogação, rate limit, webhook, sensi, utilitários)
cd web && npm test     # usa um Postgres de TESTE (TEST_DATABASE_URL, padrão: banco local cupulo_test)

# Bot: 15 testes com interações simuladas
cd bot && npm test
```

Os testes do site **apagam as tabelas** do banco de teste. Por segurança, só rodam se o nome do banco contiver `test`.

---

## 10. ✅ Checklist para colocar no ar

**Discord**
- [ ] Aplicação criada; `AUTH_DISCORD_ID` e `AUTH_DISCORD_SECRET` copiados
- [ ] Redirect `https://SEU-DOMINIO/api/auth/callback/discord` adicionado (e o de `localhost` para testes)
- [ ] Webhook do canal da staff criado (`DISCORD_WEBHOOK_URL`)
- [ ] Seu ID (e dos outros admins) em `ADMIN_DISCORD_IDS`

**Supabase**
- [ ] Projeto criado (região São Paulo)
- [ ] `DATABASE_URL` (pooler 6543) e `DIRECT_URL` (pooler 5432)
- [ ] Bucket `packs` **privado** e bucket `imagens` **público**, com limite de tamanho
- [ ] `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Data API desativada (ou `public` fora dos schemas expostos)
- [ ] `npm run db:deploy && npm run db:seed` rodados

**Vercel**
- [ ] Repositório importado com Root Directory `web`
- [ ] Todas as variáveis cadastradas (sem `AUTH_DEV_LOGIN`)
- [ ] `AUTH_SECRET`, `KEY_PEPPER` e `BOT_API_TOKEN` gerados com valores aleatórios **e guardados em lugar seguro**
- [ ] `NEXT_PUBLIC_SITE_URL` com a URL final e `NEXT_PUBLIC_DISCORD_INVITE_URL` com o convite
- [ ] Deploy feito e domínio configurado

**Bot**
- [ ] Bot criado, token em `DISCORD_TOKEN`, convidado com **Gerenciar cargos**
- [ ] Cargo do bot **acima** do cargo Cliente
- [ ] `STAFF_ROLE_IDS`, `CLIENT_ROLE_ID` e `DELIVERY_LOG_CHANNEL_ID` preenchidos
- [ ] `BOT_API_TOKEN` igual ao do site e `SITE_URL` apontando para o site
- [ ] `npm run deploy-commands` rodado e bot hospedado 24h

**Conteúdo**
- [ ] Em **Admin → Produtos**: imagens, arquivos, vídeos e tutoriais reais de cada produto
- [ ] Valores do Gerador de Sensi calibrados (`web/src/lib/sensi/`)
- [ ] Termos revisados (`web/src/app/termos/page.tsx`)

**Teste final em produção**
- [ ] Entrar com Discord no site
- [ ] `/entregar` para você mesmo → key chega na DM → **Resgatar agora** → "LIBERADO"
- [ ] O aviso aparece no canal do webhook
- [ ] Biblioteca mostra o contador; a página do produto baixa o arquivo
- [ ] `/consultarkey` mostra a key como resgatada
- [ ] Revogar a key de teste no admin e conferir que o acesso some
