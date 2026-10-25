import type { Metadata } from "next";
import { Markdown } from "@/components/ui/markdown";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Termos de Uso e Privacidade",
  description: "Termos de uso da CUPULO STORE e como tratamos seus dados.",
};

// Edite o texto abaixo para refletir as regras da loja.
const TERMOS = `
_Última atualização: 25 de outubro de 2026._

Ao entrar no site com o Discord ou resgatar uma key, você concorda com estes termos.

## 1. Quem somos
A **CUPULO STORE** vende produtos digitais para Free Fire (packs de sensibilidade, configurações, otimizações e ferramentas). As vendas e o atendimento acontecem no nosso servidor do Discord. **Não temos qualquer vínculo com a Garena** ou com o Free Fire; os nomes são usados apenas para identificar a compatibilidade dos produtos.

## 2. Como funciona a compra
1. O pagamento é feito no nosso servidor do Discord, com a staff.
2. Após a confirmação, você recebe uma **key** no formato \`CUPULO-XXXX-XXXX-XXXX\`.
3. A key é resgatada aqui no site, com login do Discord, e libera o produto comprado pelo período contratado (7 dias, 30 dias ou vitalício).

## 3. Regras das keys e do acesso
- Cada key vale **uma única vez** e fica vinculada à conta do Discord que a resgatou.
- O tempo começa a contar **no momento do resgate**. Resgatar outra key do mesmo produto **soma** o tempo.
- Ao fim do período, o acesso expira automaticamente. "Vitalício" significa enquanto a loja e o produto existirem.
- É proibido **compartilhar, revender ou repassar** keys, arquivos ou o acesso à conta.
- Podemos **revogar** keys e acessos em caso de fraude, estorno (chargeback), compartilhamento ou violação destes termos.

## 4. Uso dos produtos
Os produtos são configurações e conteúdos de apoio. Os resultados variam de acordo com aparelho, conexão e habilidade de cada jogador; **não garantimos** desempenho, ranqueamento ou resultado específico. O uso é de responsabilidade do jogador, que deve respeitar os termos do jogo.

## 5. Reembolso
Por se tratar de conteúdo digital liberado imediatamente, pedidos de reembolso são analisados pela staff no Discord, caso a caso, conforme o Código de Defesa do Consumidor. Keys já resgatadas e arquivos já baixados normalmente não são reembolsáveis, exceto quando o produto não funcionar como descrito.

## 6. Privacidade (LGPD)
**Dados que coletamos:**
- Do Discord, ao entrar: ID, nome de usuário, nome de exibição e avatar. Não pedimos e-mail nem senha; a senha do Discord nunca passa pelo nosso site.
- Histórico de keys resgatadas, acessos e downloads.
- Um **código anônimo derivado do IP** (hash), usado só para segurança e para limitar tentativas de força bruta.

**Para que usamos:** liberar e controlar seus acessos, entregar os arquivos, prevenir fraudes e dar suporte.

**Com quem compartilhamos:** apenas com os serviços necessários para o site funcionar (hospedagem, banco de dados e armazenamento de arquivos) e com o Discord, no próprio login. **Não vendemos seus dados.**

**Cookies:** usamos apenas um cookie de sessão, essencial para manter você conectado.

**Seus direitos:** você pode pedir acesso, correção ou exclusão dos seus dados abrindo um ticket no nosso Discord. A exclusão encerra seus acessos aos produtos.

## 7. Alterações
Podemos atualizar estes termos. A data no topo indica a última versão. Mudanças importantes serão avisadas no Discord.

## 8. Contato
Dúvidas, suporte ou pedidos sobre seus dados: abra um ticket no nosso servidor do Discord.
`;

export default function TermosPage() {
  return (
    <>
      <PageHeader kicker="Transparência" title="Termos e privacidade" brush="o combinado não sai caro" />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Markdown>{TERMOS}</Markdown>
      </div>
    </>
  );
}
