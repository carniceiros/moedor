import fs from 'fs/promises';
import path from 'path';

/**
 * Configuração do Next: aumenta o limite do body parser para 1 MB.
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

// Função para ler lista de usuários do banco JSON
async function readUsers(dbPath) {
  try {
    const contents = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(contents);
  } catch (err) {
    return [];
  }
}

// Função para escrever a lista de usuários
async function writeUsers(dbPath, users) {
  await fs.mkdir(path.dirname(dbPath), { recursive: true }).catch(() => {});
  await fs.writeFile(dbPath, JSON.stringify(users, null, 2), 'utf8');
}

// Envia requisição para a API do Discord usando fetch
async function discordRequest(url, options = {}) {
  const res = await fetch(url, options);
  // Considera 204 e 201 como sucesso
  if (!res.ok && res.status !== 204 && res.status !== 201) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }
  // Valida o token secreto enviado pela Hotmart
  const hottokHeader = req.headers['x-hotmart-hottok'] || req.headers['X-HOTMART-HOTTOK'];
  if (!process.env.HOTMART_HOTTOK || hottokHeader !== process.env.HOTMART_HOTTOK) {
    res.status(401).json({ error: 'HOTTOK inválido' });
    return;
  }
  // Payload enviado pelo Hotmart (Next já faz parse JSON)
  const payload = req.body || {};
  try {
    // Extrai email, status e ID de assinatura; os campos podem variar
    const buyer = payload.buyer || payload.subscriber || {};
    const buyerEmail = buyer.email || payload.buyer_email || '';
    const subscription = payload.subscription || payload.purchase || {};
    const subscriptionId = subscription.id || payload.subscription_id || '';
    const statusRaw = subscription.status || payload.status || payload.purchase_status;
    const status = statusRaw ? String(statusRaw).toUpperCase() : '';
    const plan = subscription.plan || payload.plan || '';

    // Caminho do banco
    const dbPath = process.env.DB_PATH || path.join('/tmp', 'members.json');
    const users = await readUsers(dbPath);
    let userRecord = users.find((u) => u.hotmart_email === buyerEmail);
    if (userRecord) {
      userRecord.subscription_id = subscriptionId;
      userRecord.status = status;
      userRecord.plan = plan;
    } else {
      userRecord = {
        hotmart_email: buyerEmail,
        subscription_id: subscriptionId,
        discord_user_id: '',
        status: status,
        plan: plan,
      };
      users.push(userRecord);
    }
    await writeUsers(dbPath, users);

    // Se existe discord_user_id definido, aplica cargos
    const discordUserId = userRecord.discord_user_id;
    if (discordUserId) {
      const guildId = process.env.DISCORD_GUILD_ID;
      const botToken = process.env.DISCORD_BOT_TOKEN;
      const roleActive = process.env.ROLE_CARNICEIRO_ID;
      const rolePending = process.env.ROLE_PENDENTE_ID;
      if (!guildId || !botToken) {
        console.warn('Faltando configurações do Discord; não foi possível alterar cargos.');
      } else {
        // Funções inline para adicionar/remover
        async function addRole(roleId) {
          if (!roleId) return;
          await discordRequest(
            `https://discord.com/api/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
            { method: 'PUT', headers: { Authorization: `Bot ${botToken}` } }
          ).catch((err) => console.warn('Erro ao adicionar cargo', roleId, err.message));
        }
        async function removeRole(roleId) {
          if (!roleId) return;
          await discordRequest(
            `https://discord.com/api/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`,
            { method: 'DELETE', headers: { Authorization: `Bot ${botToken}` } }
          ).catch((err) => console.warn('Erro ao remover cargo', roleId, err.message));
        }
        if (['APPROVED', 'PAID', 'ACTIVE'].includes(status)) {
          await addRole(roleActive);
          await removeRole(rolePending);
        } else if (
          ['DELAYED', 'OVERDUE', 'PENDING', 'EXPIRED', 'CANCELED', 'CANCELLED', 'REFUNDED', 'CHARGEBACK', 'SUSPENDED'].includes(
            status
          )
        ) {
          await addRole(rolePending);
          await removeRole(roleActive);
        }
      }
    }
    // Resposta de sucesso
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro no Webhook Hotmart:', err.message);
    res.status(500).json({ error: 'Erro ao processar webhook.' });
  }
}