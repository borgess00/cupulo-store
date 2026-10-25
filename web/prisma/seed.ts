// Seed inicial: os 9 produtos da loja.
// Idempotente: pode rodar várias vezes (atualiza pelo slug, não apaga nada).
// Rodar: npm run db:seed
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Platform, type ProductType } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type SeedProduct = {
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  category: string;
  platform: Platform;
  type?: ProductType;
  tutorialMd: string;
};

const tutorialPadrao = (aparelho: string) => `## Antes de começar
- Atualize o Free Fire para a versão mais recente.
- Feche os outros apps abertos no ${aparelho}.

## Instalação
1. Toque em **Baixar** e salve o arquivo do pack.
2. Siga o vídeo acima com calma, etapa por etapa.
3. Abra o Free Fire e teste no **modo treino** antes de ir para a ranqueada.

## Dúvidas
Abra um ticket no nosso servidor do Discord que a staff te ajuda.

> Este tutorial é um modelo. Edite pelo painel admin com o passo a passo real.`;

const produtos: SeedProduct[] = [
  {
    slug: "pack-mobilador",
    name: "Pack Mobilador",
    shortDesc: "Configuração completa para quem joga no PC com teclado e mouse.",
    description:
      "Pack pensado para **mobilador**: mapeamento de teclas, sensibilidade de mouse e ajustes de mira para ganhar consistência no capa.",
    category: "Packs",
    platform: "MOBILADOR",
    tutorialMd: tutorialPadrao("PC"),
  },
  {
    slug: "pack-emulador",
    name: "Pack Emulador",
    shortDesc: "Sensibilidade e otimização para BlueStacks, MSI e similares.",
    description:
      "Ajustes do emulador, sensibilidade e configurações gráficas para rodar liso e com mira precisa.",
    category: "Packs",
    platform: "EMULADOR",
    tutorialMd: tutorialPadrao("PC"),
  },
  {
    slug: "pack-android",
    name: "Pack Android",
    shortDesc: "O pack completo de sensibilidade para Android.",
    description:
      "Sensibilidade calibrada, configurações do jogo e ajustes do sistema para Android. Inclui atualizações durante o período de acesso.",
    category: "Packs",
    platform: "ANDROID",
    tutorialMd: tutorialPadrao("celular"),
  },
  {
    slug: "pack-iphone",
    name: "Pack iPhone",
    shortDesc: "O pack completo de sensibilidade para iPhone.",
    description:
      "Sensibilidade calibrada e configurações pensadas para a tela e o toque do iPhone.",
    category: "Packs",
    platform: "IOS",
    tutorialMd: tutorialPadrao("iPhone"),
  },
  {
    slug: "auxilio-android",
    name: "Auxílio Android",
    shortDesc: "Ajustes extras de precisão para Android.",
    description: "Configurações complementares para deixar a mira mais estável no Android.",
    category: "Auxílios",
    platform: "ANDROID",
    tutorialMd: tutorialPadrao("celular"),
  },
  {
    slug: "boneco-lento-android",
    name: "Boneco Lento Android",
    shortDesc: "Ajuste de movimentação para Android.",
    description: "Pack de ajuste de movimentação do personagem para Android.",
    category: "Boneco Lento",
    platform: "ANDROID",
    tutorialMd: tutorialPadrao("celular"),
  },
  {
    slug: "boneco-lento-iphone",
    name: "Boneco Lento iPhone",
    shortDesc: "Ajuste de movimentação para iPhone.",
    description: "Pack de ajuste de movimentação do personagem para iPhone.",
    category: "Boneco Lento",
    platform: "IOS",
    tutorialMd: tutorialPadrao("iPhone"),
  },
  {
    slug: "otimizacao-ios",
    name: "Otimização iOS",
    shortDesc: "Menos travadas e mais FPS no iPhone.",
    description: "Ajustes do iOS para reduzir travamentos, aquecimento e quedas de FPS durante a partida.",
    category: "Otimização",
    platform: "IOS",
    tutorialMd: tutorialPadrao("iPhone"),
  },
  {
    slug: "gerador-sensi-ios",
    name: "Gerador de Sensi iOS",
    shortDesc: "Ferramenta que calcula a sensi ideal para o seu iPhone.",
    description:
      "Informe o modelo do seu iPhone, o tamanho da tela e o seu estilo de jogo: o gerador calcula a sensibilidade recomendada para **Geral, Ponto Vermelho, Mira 2x, 4x, AWM e Olhadinha**.",
    category: "Ferramentas",
    platform: "IOS",
    type: "TOOL",
    tutorialMd: `## Como usar
1. Abra o gerador pelo botão **Abrir gerador**.
2. Escolha o modelo do seu iPhone (a tela é preenchida sozinha).
3. Escolha o seu estilo de jogo e gere a sensi.
4. Copie os valores para o Free Fire e ajuste fino no modo treino.`,
  },
];

async function main() {
  for (const [i, p] of produtos.entries()) {
    const data = {
      name: p.name,
      shortDesc: p.shortDesc,
      description: p.description,
      category: p.category,
      platform: p.platform,
      type: p.type ?? "PACK",
      tutorialMd: p.tutorialMd,
      sortOrder: i,
    };
    const product = await db.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      // Não sobrescreve o que o admin já editou: só garante que existe.
      update: {},
    });
    const hasChangelog = await db.changelogEntry.count({ where: { productId: product.id } });
    if (!hasChangelog) {
      await db.changelogEntry.create({
        data: { productId: product.id, version: "1.0", notes: "Lançamento na CUPULO STORE." },
      });
    }
    console.log(`✔ ${p.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
