# Hotmart Discord Vercel

Este projeto demonstra como integrar eventos de assinatura do Hotmart com um servidor Discord de forma automatizada. Ele consiste em uma aplicação **Next.js** hospedável na Vercel com funções serverless para:

1. **Receber Webhooks da Hotmart** e registrar/atualizar o status da assinatura no banco de dados.
2. **Vincular a conta Discord do assinante** via OAuth2 (escopos `identify` e `guilds.join`).
3. **Gerenciar cargos no Discord** (adicionar ou remover) com base no status da assinatura.

> ⚠️ **Observação sobre persistência de dados**: Vercel não oferece um armazenamento de arquivos permanente para funções serverless. Neste exemplo foi utilizado um banco **SQLite** localizado em `/tmp/members.db` apenas para fins ilustrativos. Para uso em produção recomenda‑se utilizar um banco externo (MySQL, PostgreSQL, MongoDB, DynamoDB etc.) ou outro mecanismo de persistência.

## Requisitos

- Node.js 18 ou superior.
- Conta na Hotmart com permissões para criar Webhooks.
- Aplicação Discord registrada e um bot com permissões **Manage Roles** e **Add Members** (guilds.join).
- Acesso ao painel de administração da sua guild no Discord para criar cargos “Carniceiro” e “Pendente” e obter seus IDs.

## Configuração

1. Clone este repositório ou copie os arquivos para seu projeto Vercel.
2. Instale as dependências:

   ```bash
   npm install
   # ou com yarn
   yarn install
   ```

3. Copie o arquivo `.env.local.example` para `.env.local` e preencha todos os valores:

   - `HOTMART_HOTTOK`: token secreto configurado no Hotmart para seu Webhook.
   - `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`: obtidos no [Discord Developer Portal](https://discord.com/developers/applications).
   - `DISCORD_REDIRECT_URI`: URL pública da rota `/api/discord/callback` (ex.: `https://seu-projeto.vercel.app/api/discord/callback`).
   - `DISCORD_BOT_TOKEN`: token do bot que está no seu servidor.
   - `DISCORD_GUILD_ID`: ID do seu servidor (guild) Discord.
   - `ROLE_CARNICEIRO_ID` e `ROLE_PENDENTE_ID`: IDs dos cargos criados no servidor.

4. Faça o deploy no Vercel (pelo dashboard ou via CLI). O Vercel irá detectar automaticamente a aplicação Next.js.

5. No painel da Hotmart, configure um **Webhook de Assinaturas** com o endpoint:
   ```
   https://seu-projeto.vercel.app/api/webhooks/hotmart
   ```
   e defina o mesmo `HOTTOK` configurado no arquivo `.env.local`.

6. Depois que o comprador realizar o pagamento, envie‑lhe um link para a página principal do seu site, passando o email usado na compra, por exemplo:

   ```
   https://seu-projeto.vercel.app/?email=usuário@exemplo.com
   ```

   A página exibirá um botão “Conectar com Discord” que inicia o fluxo de login. O parâmetro `state` enviado para o Discord contém o email e permitirá que o servidor relacione a conta do Discord ao registro da assinatura.

## Fluxo resumido

1. **Compra/assinatura na Hotmart**: O Webhook envia um POST para `/api/webhooks/hotmart` com dados da compra. O servidor registra ou atualiza o status e, se o usuário já vinculou o Discord, ajusta os cargos conforme as regras.
2. **Vincular Discord**: O assinante acessa sua página e clica em **Conectar com Discord**. O fluxo OAuth2 redireciona para `/api/discord/callback`, onde trocamos o `code` por um token, pegamos o `user_id` do Discord e salvamos no banco.
3. **Gerenciamento de cargos**: Sempre que o status muda (via Webhook) ou quando o usuário conecta o Discord, o servidor usa a API do Discord para dar/remover cargos. Assinaturas ativas recebem o cargo **Carniceiro**; pendentes, atrasadas ou canceladas recebem (ou mantêm) o cargo **Pendente**.

## Considerações

- **Segurança**: sempre valide o header `X-HOTMART-HOTTOK` no Webhook. Recuse requisições sem esse token.
- **Permissões do bot**: o cargo do bot deve estar acima de “Carniceiro” e “Pendente” na hierarquia do Discord para que ele possa atribuí‑los.
- **Escopos do OAuth2**: o escopo `guilds.join` permite que o bot adicione o usuário ao servidor se ainda não estiver; `identify` é necessário para obter a ID.
- **Banco de dados persistente**: substitua o uso do SQLite por um banco hospedado. Ajuste a lógica de criação/consulta conforme o driver escolhido.

## License

MIT