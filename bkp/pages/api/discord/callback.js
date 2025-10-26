import fs from 'fs/promises';
import path from 'path';

/**
 * Lê o arquivo de usuários. Se o arquivo não existir ou estiver vazio,
 * retorna um array vazio. O caminho é determinado pela variável de ambiente
 * DB_PATH ou, caso ausente, utiliza `/tmp/members.json`.
 */
async function readUsers(dbPath) {
  try {
    const contents = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(contents);
  } catch (err) {
    return [];
  }
}

/**
 * Escreve o array de usuários no arquivo especificado. Garante que o
 * diretório exista antes de tentar escrever.
 */
async function writeUsers(dbPath, users) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true }).catch(() => {});
  await fs.writeFile(dbPath, JSON.stringify(users, null, 2), 'utf8');
}

/**
 * Chama a API do Discord usando fetch. Encapsula erros de rede para
 * simplificar o código abaixo.
 */
async function discordRequest(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok && res.status !== 204 && res.status !== 201) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res;
}

/**
 * Endpoint de callback do OAuth2 do Discord
 *
 * Este endpoint processa o retorno do Discord após o usuário autorizar a
 * aplicação. Ele troca o `code` por um access token, recupera a ID do
 * usuário, adiciona o usuário ao servidor e atualiza nosso banco (arquivo
 * JSON). Se existir um registro prévio com status salvo, atribui ou
 * remove cargos conforme a assinatura.
 */
export default async function handler(req, res) {
  const { code, state } = req.query;
  if (!code) {
    res.status(400).json({ error: 'Código de autorização ausente.' });
    return;
  }
  const buyerEmail = state ? decodeURIComponent(state) : '';

  try {
    // Troca o código por um access token de usuário
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', process.env.DISCORD_CLIENT_ID || '');
    tokenParams.append('client_secret', process.env.DISCORD_CLIENT_SECRET || '');
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', process.env.DISCORD_REDIRECT_URI || '');
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });
    if (!tokenResponse.ok) {
      const msg = await tokenResponse.text();
      throw new Error(`Falha ao obter token: ${msg}`);
    }
    const tokenJson = await tokenResponse.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      throw new Error('Token de acesso ausente na resposta do Discord.');
    }

    // Obtém informações do usuário autenticado
    const meResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!meResponse.ok) {
      const msg = await meResponse.text();
      throw new Error(`Falha ao buscar dados do usuário: ${msg}`);
    }
    const meData = await meResponse.json();
    const discordUserId = meData.id;

    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    // Tenta adicionar o usuário ao servidor. Caso ele já esteja, o Discord
    // retorna erro 204 e não precisamos tratar como erro fatal.
    try {
      await discordRequest(
        `https://discord.com/api/guilds/${guildId}/members/${discordUserId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token: accessToken }),
        }
      );
    } catch (err) {
      console.warn('Aviso ao adicionar membro ao servidor:', err.message);
    }

    // Carrega ou inicia o banco de usuários
    const dbPath = process.env.DB_PATH || path.join('/tmp', 'members.json');
    const users = await readUsers(dbPath);
    // Encontra ou cria registro
    let userRecord = users.find((u) => u.hotmart_email === buyerEmail);
    if (userRecord) {
      userRecord.discord_user_id = discordUserId;
    } else {
      userRecord = {
        hotmart_email: buyerEmail,
        subscription_id: '',
        discord_user_id: discordUserId,
        status: '',
        plan: '',
      };
      users.push(userRecord);
    }

    // Salva alterações no banco
    await writeUsers(dbPath, users);

    // Se já temos um status salvo, definimos cargos no Discord
    const userStatus = (userRecord.status || '').toUpperCase();
    const roleActive = process.env.ROLE_CARNICEIRO_ID;
    const rolePending = process.env.ROLE_PENDENTE_ID;
    async function addRole(roleId) {
      if (!roleId) return;
      await discordRequest(
        `https://discord.com/api/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bot ${botToken}` },
        }
      ).catch((err) => {
        console.warn('Erro ao adicionar cargo', roleId, err.message);
      });
    }
    async function removeRole(roleId) {
      if (!roleId) return;
      await discordRequest(
        `https://discord.com/api/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bot ${botToken}` },
        }
      ).catch((err) => {
        console.warn('Erro ao remover cargo', roleId, err.message);
      });
    }
    if (userStatus) {
      if (['APPROVED', 'PAID', 'ACTIVE'].includes(userStatus)) {
        await addRole(roleActive);
        await removeRole(rolePending);
      } else {
        await addRole(rolePending);
        await removeRole(roleActive);
      }
    }
    // Retorna uma resposta HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(
      `<html><body style="font-family: sans-serif; text-align: center; padding: 2rem;">
        <h1>Discord conectado!</h1>
        <p>Seus dados foram vinculados com sucesso. Você pode fechar esta janela.</p>
      </body></html>`
    );
  } catch (err) {
    console.error('Erro no callback OAuth do Discord:', err.message);
    res.status(500).json({ error: 'Falha ao processar callback do Discord.' });
  }
}