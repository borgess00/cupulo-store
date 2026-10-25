# Bot do Discord — CUPULO STORE

Bot em **discord.js v14 + TypeScript** que gera e entrega as keys da loja.
Ele **não acessa o banco**: tudo passa pela API protegida do site (`/api/bot/*`) com o `BOT_API_TOKEN`.

## Comandos

| Comando | Quem usa | O que faz |
|---|---|---|
| `/entregar usuario produto duracao` | Staff | Gera 1 key e manda na **DM do cliente** com o passo a passo e o botão **Resgatar agora** (abre o site com a key preenchida). Se a DM estiver fechada, mostra a key para a staff entregar manualmente. Dá o cargo **Cliente** (opcional) e registra no canal de log (opcional). |
| `/gerarkey produto duracao quantidade` | Staff | Gera de 1 a 100 keys (resposta só a staff vê). Mais de 20 vêm num arquivo `.txt`. |
| `/consultarkey key` | Staff | Status da key: disponível, resgatada (por quem, quando, até quando vale) ou revogada. |
| `/acessos usuario` | Staff | Produtos ativos e expirados de um cliente. |
| `/resgatar` | Todos | Explica como resgatar e mostra o link do site. |

`duracao`: **7 dias**, **30 dias** ou **Vitalícia**. O campo `produto` tem autocomplete com os produtos do site.
Toda resposta de staff é **efêmera** (só quem usou o comando vê).

---

## 1. Criar o bot no Discord

Você pode usar **a mesma aplicação** criada para o login do site.

1. Acesse <https://discord.com/developers/applications> e abra a aplicação.
2. Copie o **Application ID** em *General Information*: esse é o `DISCORD_CLIENT_ID`.
3. Em **Bot**:
   - clique em **Reset Token** e copie o token: esse é o `DISCORD_TOKEN`. Nunca compartilhe o token.
   - **não** é preciso ativar nenhum *Privileged Gateway Intent*.
4. Convide o bot para o seu servidor com este link. Troque `SEU_CLIENT_ID`:

   ```
   https://discord.com/oauth2/authorize?client_id=SEU_CLIENT_ID&scope=bot%20applications.commands&permissions=268487680
   ```

   Permissões incluídas: Ver canais, Enviar mensagens, Inserir links, Anexar arquivos e **Gerenciar cargos** (para dar o cargo Cliente).
5. Em **Configurações do servidor → Cargos**, arraste o cargo do bot para **acima** do cargo **Cliente**. Sem isso, o Discord não deixa o bot dar o cargo.

### Pegar os IDs

Ative o **Modo desenvolvedor** no Discord (*Configurações → Avançado*). Depois, clique com o botão direito para copiar:
- o **servidor** → `DISCORD_GUILD_ID`
- o(s) cargo(s) de **staff** → `STAFF_ROLE_IDS` (separe com vírgula se forem vários)
- o cargo **Cliente** → `CLIENT_ROLE_ID` (opcional)
- o canal de **log de entregas** → `DELIVERY_LOG_CHANNEL_ID` (opcional)

## 2. Configurar

```bash
cd bot
cp .env.example .env    # preencha os valores
npm install
```

`SITE_URL` é o endereço público do site. `BOT_API_TOKEN` tem que ser **exatamente o mesmo** valor configurado no site.

## 3. Rodar

```bash
npm run build            # compila para dist/
npm run deploy-commands  # registra os slash commands no servidor (rode de novo se mudar algum comando)
npm start                # liga o bot
```

Em desenvolvimento: `npm run deploy-commands:dev` e depois `npm run dev`, que reinicia sozinho a cada alteração.

Se algo estiver faltando no `.env`, o bot mostra exatamente qual variável corrigir.

## 4. Colocar no ar (24h)

O bot precisa ficar ligado o tempo todo. Escolha uma opção:

### Railway
1. Crie um projeto a partir do repositório do GitHub.
2. Em **Settings → Root Directory**, coloque `bot`.
3. **Build Command**: `npm ci && npm run build`
4. **Start Command**: `npm run deploy-commands && npm start`. Registrar os comandos a cada deploy é seguro.
5. Em **Variables**, adicione as variáveis do `.env.example`.

### Discloud
1. No seu computador: `npm install && npm run build`.
2. Compacte em um `.zip` a pasta `dist/`, a pasta `assets/`, o `package.json`, o `package-lock.json` e o `discloud.config`. **Não** inclua `node_modules` nem o `.env`.
3. Envie o zip pelo painel ou pelo bot da Discloud e configure as variáveis de ambiente no painel.
4. Antes de enviar, rode uma vez `npm run deploy-commands` no seu computador, com o `.env` preenchido.

### VPS (Ubuntu) com PM2
```bash
git clone https://github.com/borgess00/cupulo-store.git && cd cupulo-store/bot
cp .env.example .env && nano .env
npm ci && npm run build && npm run deploy-commands
npm i -g pm2
pm2 start dist/index.js --name cupulo-bot
pm2 save && pm2 startup
```

## Esconder os comandos de staff dos clientes (opcional)

O bot já recusa comandos de staff de quem não tem o cargo. Para nem aparecerem na lista: **Configurações do servidor → Integrações → (seu bot) → Comandos**. Ali, restrinja `/entregar`, `/gerarkey`, `/consultarkey` e `/acessos` aos cargos de staff.

## Testes

```bash
npm test        # testes dos comandos com interações simuladas (não conecta no Discord)
npm run lint
npm run typecheck
```

Para testar os comandos contra um site de verdade, sem Discord:

```bash
SITE_URL=http://localhost:3000 BOT_API_TOKEN=... npx tsx scripts/smoke-site.ts
```

## Problemas comuns

| Sintoma | Solução |
|---|---|
| "O site recusou o token do bot" | O `BOT_API_TOKEN` do bot é diferente do configurado no site. |
| "Não consegui falar com o site" | Confira o `SITE_URL` e se o site está no ar. |
| Comandos não aparecem | Rode `npm run deploy-commands` e confira o `DISCORD_GUILD_ID`. |
| "Não consegui dar o cargo Cliente" | Cargo do bot abaixo do cargo Cliente, ou o bot sem a permissão **Gerenciar cargos**. |
| "DM fechada" | O cliente bloqueia DMs de membros do servidor. Envie a key mostrada para a staff por ticket. |
