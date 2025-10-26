/**
 * API Route: /api/discord/login
 *
 * Esta rota inicia o fluxo de autenticação OAuth2 do Discord. Ela espera
 * receber um parâmetro de query `state` que identifica o usuário (geralmente
 * o email do comprador do Hotmart). Esse estado é retornado na callback
 * (/api/discord/callback) para que possamos associar a conta Discord ao
 * registro correto no banco de dados.
 */
export default async function handler(req, res) {
  const { state = '' } = req.query;
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const scope = 'identify guilds.join';
  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'Configuração OAuth do Discord ausente.' });
    return;
  }

  // Verifica se o email informado (state) existe no banco de registros do Hotmart.
  const buyerEmail = state ? decodeURIComponent(state) : '';
  if (buyerEmail) {
    // Lê o banco (JSON) e procura o email. Usa DB_PATH se definido ou /tmp/members.json.
    const fs = await import('fs/promises');
    const path = await import('path');
    const dbPath = process.env.DB_PATH || path.default.join('/tmp', 'members.json');
    async function readUsers(filePath) {
      try {
        const data = await fs.default.readFile(filePath, 'utf8');
        return JSON.parse(data);
      } catch (e) {
        return [];
      }
    }
    const users = await readUsers(dbPath);
    const exists = users.find((u) => u.hotmart_email === buyerEmail);
    if (!exists) {
      // Email não encontrado: retorna página com erro
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(
        `<html><body style="font-family: sans-serif; text-align: center; padding: 2rem;">
          <h1>Email não encontrado</h1>
          <p>O email <strong>${buyerEmail}</strong> não corresponde a um comprador válido do Hotmart.</p>
          <p>Verifique o endereço digitado ou entre em contato com o suporte.</p>
        </body></html>`
      );
      return;
    }
  }

  // Construindo a URL de autorização do Discord
  const authUrl =
    'https://discord.com/api/oauth2/authorize' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&response_type=code' +
    '&scope=' + encodeURIComponent(scope) +
    '&state=' + encodeURIComponent(state);

  // Redireciona o usuário para o Discord para autorizar.
  res.setHeader('Location', authUrl);
  res.statusCode = 302;
  res.end();
}