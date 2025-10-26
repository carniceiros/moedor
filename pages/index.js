// pages/index.js
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const prefilledOnce = useRef(false);

  // Inicializa UMA vez com o ?email= da URL (se houver), mas não “prende” ao query
  useEffect(() => {
    if (!prefilledOnce.current && router.isReady) {
      const q = router.query?.email;
      if (typeof q === 'string' && q.length > 0) setEmail(q);
      prefilledOnce.current = true;
    }
  }, [router.isReady]); // <- importante: NÃO dependa de router.query.email aqui

  const isValid = /^\S+@\S+\.\S+$/.test(email);

  const handleConnect = () => {
    // usa o state (editável) para montar o state da OAuth
    router.push(`/api/discord/login?state=${encodeURIComponent(email)}`);
  };

  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', fontFamily: 'system-ui' }}>
      <h1 style={{ textAlign: 'center' }}>Conectar Discord</h1>
      <p style={{ textAlign: 'center', lineHeight: 1.6 }}>
        Se você acabou de comprar um plano no Hotmart, use esta página para vincular sua conta do Discord e
        receber automaticamente o cargo correspondente.
      </p>

      <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'center' }}>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="seu_email@dominio.com"
          value={email}                         {/* <- controlado por state local */}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '10px 12px', width: '60%' }}
        />
        <button
          onClick={handleConnect}
          disabled={!isValid}
          style={{ padding: '10px 16px', opacity: isValid ? 1 : 0.5, cursor: isValid ? 'pointer' : 'not-allowed' }}
        >
          Conectar com Discord
        </button>
      </div>

      {email && (
        <p style={{ textAlign: 'center', marginTop: 12 }}>
          Email detectado: <strong>{email}</strong>
        </p>
      )}
    </main>
  );
}
