// pages/index.js
import { useMemo, useState } from 'react';

export default function Home() {
  const initialEmail = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const q = new URLSearchParams(window.location.search).get('email');
    return typeof q === 'string' ? q : '';
  }, []);
  const [email, setEmail] = useState(initialEmail);
  const isValid = /\S+@\S+\.\S+/.test(email);

  const handleConnect = (e) => {
    e.preventDefault();
    if (!isValid) return;
    window.location.href = `/api/discord/login?state=${encodeURIComponent(email)}`;
  };

  return (
    <main style={{ maxWidth: 680, margin: '4rem auto', fontFamily: 'system-ui' }}>
      <h1 style={{ textAlign: 'center' }}>Conectar Discord</h1>
      <p style={{ textAlign: 'center', lineHeight: 1.6 }}>
        Se você acabou de comprar um plano no Hotmart, use esta página para vincular sua conta do Discord
        e receber automaticamente o cargo correspondente.
      </p>

      <form onSubmit={handleConnect} style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu_email@dominio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '10px 12px', width: '60%' }}
        />
        <button type="submit" disabled={!isValid} style={{ padding: '10px 16px', opacity: isValid ? 1 : 0.5 }}>
          Conectar com Discord
        </button>
      </form>

      {email && (
        <p style={{ textAlign: 'center', marginTop: 12 }}>
          Email detectado: <strong>{email}</strong>
        </p>
      )}
    </main>
  );
}
