import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * Página principal
 *
 * Esta página recebe um parâmetro de consulta `email` (o email do comprador do Hotmart) e
 * exibe um botão para conectar a conta do Discord. Quando clicado, o usuário é
 * redirecionado para a rota `/api/discord/login` que inicia o fluxo OAuth2 do Discord.
 */
export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (router.query.email) {
      // Preenche o email a partir do parâmetro da URL (por ex.: ?email=usuario%40dominio.com)
      setEmail(String(router.query.email));
    }
  }, [router.query.email]);

  const handleConnect = () => {
    // Codifica o estado para que possamos identificá‑lo na callback do OAuth
    const state = encodeURIComponent(email || '');
    // Redireciona para a rota API de login do Discord. O parâmetro `state` é passado
    // para que saibamos qual email associar ao usuário quando o fluxo OAuth terminar.
    window.location.href = `/api/discord/login?state=${state}`;
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <h1>Conectar Discord</h1>
      <p style={{ maxWidth: '600px', textAlign: 'center' }}>
        Se você acabou de comprar um plano no Hotmart, use esta página para
        vincular sua conta do Discord e receber automaticamente o cargo correspondente.
      </p>
      {email ? (
        <p>Detectamos seu email: <strong>{email}</strong></p>
      ) : (
        <>
          <label htmlFor="email" style={{ marginTop: '1rem' }}>Informe seu email usado na compra:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@dominio.com"
            style={{ padding: '0.5rem', marginTop: '0.5rem', width: '100%', maxWidth: '300px' }}
          />
        </>
      )}
      <button
        onClick={handleConnect}
        style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem', cursor: 'pointer' }}
        disabled={!email}
      >
        Conectar com Discord
      </button>
    </main>
  );
}