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