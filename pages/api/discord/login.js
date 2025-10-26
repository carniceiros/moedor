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

  // Se um e‑mail foi fornecido (state), valide-o consultando a API da Hotmart em tempo real.
  // Para isso é necessário configurar as seguintes variáveis de ambiente:
  // HOTMART_CLIENT_ID, HOTMART_CLIENT_SECRET e HOTMART_BASIC.
  // A validação consulta as assinaturas ativas (status ACTIVE, PAID, APPROVED) e filtra
  // por subscriber_email. Caso o e‑mail não seja encontrado com status ativo, o login
  // é bloqueado. Se as variáveis de ambiente não estiverem configuradas, a verificação
  // é ignorada (permitindo qualquer e‑mail).
  const buyerEmail = state ? decodeURIComponent(state) : '';
  if (buyerEmail) {
    // Permite ignorar a verificação caso as credenciais da Hotmart estejam ausentes.
    const hasHotmartCreds =
      process.env.HOTMART_CLIENT_ID &&
      process.env.HOTMART_CLIENT_SECRET &&
      process.env.HOTMART_BASIC;

    if (hasHotmartCreds) {
      try {
        // Passo 1: obter access_token via client_credentials
        const tokenRes = await fetch(
          'https://api-sec-vlc.hotmart.com/security/oauth/token',
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${process.env.HOTMART_BASIC}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'client_credentials',
              client_id: process.env.HOTMART_CLIENT_ID,
              client_secret: process.env.HOTMART_CLIENT_SECRET,
            }).toString(),
          }
        );
        if (!tokenRes.ok) {
          throw new Error('Falha ao obter token da Hotmart');
        }
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        if (!accessToken) {
          throw new Error('Token de acesso ausente');
        }

        // Passo 2: buscar todas as assinaturas com status ativos.
        // Consultamos status ACTIVE, APPROVED e PAID separadamente por limitações de filtros.
        const statusParams = ['ACTIVE', 'APPROVED', 'PAID'];
        let subscriberFound = false;
        for (const status of statusParams) {
          const subsRes = await fetch(
            `https://developers.hotmart.com/payments/api/v1/subscriptions?status=${encodeURIComponent(
              status
            )}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
            }
          );
          if (!subsRes.ok) continue;
          const subsData = await subsRes.json();
          const subscriptions = Array.isArray(subsData) ? subsData : subsData.data || [];
          // Verifica se o email aparece em alguma assinatura ativa
          const match = subscriptions.find((s) => {
            const emailField =
              s.subscriber_email ||
              s.buyer_email ||
              (s.subscriber && s.subscriber.email) ||
              (s.buyer && s.buyer.email);
            return (
              typeof emailField === 'string' &&
              emailField.toLowerCase() === buyerEmail.toLowerCase()
            );
          });
          if (match) {
            subscriberFound = true;
            break;
          }
        }
        if (!subscriberFound) {
          // O email não corresponde a uma assinatura ativa
          res.statusCode = 400;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(
            `<html><body style="font-family: sans-serif; text-align: center; padding: 2rem;">
          <h1>Email não encontrado ou assinatura inativa</h1>
          <p>O email <strong>${buyerEmail}</strong> não corresponde a uma assinatura ativa do Hotmart.</p>
          <p>Verifique o endereço digitado ou aguarde a confirmação do pagamento.</p>
        </body></html>`
          );
          return;
        }
      } catch (err) {
        // Em caso de erro de rede ou autenticação, continua sem bloquear
        console.error('Erro na consulta à Hotmart:', err);
      }
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