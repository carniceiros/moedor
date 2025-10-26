import { useEffect, useState } from 'react';

/**
 * Página principal (login) com estilos inline.
 *
 * Esta versão não depende de CSS Modules, tornando o build mais simples. Ela
 * renderiza uma página de fundo com o tema do Moedor e um cartão sobreposto
 * contendo o formulário de e‑mail. O e‑mail é pré‑preenchido a partir do parâmetro
 * `?email=` na URL, quando presente, e pode ser editado livremente pelo usuário.
 */
export default function Home() {
  const [email, setEmail] = useState('');

  // Preenche o estado inicial com o parâmetro "email" da URL, se houver
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initialEmail = params.get('email');
      if (initialEmail) setEmail(initialEmail);
    }
  }, []);

  const isEmailValid = email.includes('@');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEmailValid) return;
    const state = encodeURIComponent(email);
    window.location.href = `/api/discord/login?state=${state}`;
  };

  return (
    <div
      style={{
        backgroundImage: "url('/images/moedorhorizontal.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '2rem',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
          color: '#fff',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        }}
      >
        <img
          src="/images/moedorvertical.jpg"
          alt="Moedor logo"
          style={{ width: '200px', margin: '0 auto 1rem' }}
        />
        <h1 style={{ marginBottom: '0.5rem' }}>Conectar Discord</h1>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Se você acabou de comprar um plano no Hotmart, informe o email usado na compra para
          vincular sua conta do Discord e receber automaticamente o cargo correspondente.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu_email@dominio.com"
            autoComplete="email"
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              borderRadius: '4px',
              border: 'none',
              fontSize: '1rem',
            }}
          />
          <button
            type="submit"
            disabled={!isEmailValid}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '4px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: isEmailValid ? '#d62828' : 'rgba(214, 40, 40, 0.5)',
              cursor: isEmailValid ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s ease-in-out',
            }}
          >
            Conectar com Discord
          </button>
        </form>
      </div>
    </div>
  );
}