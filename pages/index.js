// pages/index.js
import { useRouter } from 'next/router';
import { useState, useMemo } from 'react';

export default function Home() {
  // NÃO use router.query como fonte da verdade do input
  const router = useRouter();

  // Pega o ?email= só uma vez no lado do cliente
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
    <main style={{ maxWidth: 680, margin: '4rem auto', fontFamily: 'bebas neue' }}>
      <h1 style={{ textAlign: 'center' }}>Conectar Discord</h1>
      <p style={{ textAlign: 'center' }}>
        Faaaaala Carniceiro! Se você acabou de comprar um plano no Hotmart, use esta página para vincular sua conta do Discord.
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
