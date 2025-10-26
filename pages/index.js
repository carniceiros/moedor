import { useEffect, useState } from 'react';
import styles from './loginStyles.module.css';

/**
 * Página principal (login)
 *
 * Esta página permite ao usuário informar o email utilizado na compra no Hotmart e
 * iniciar o fluxo OAuth2 de conexão com o Discord. Ao contrário da versão inicial,
 * o campo de email permanece visível e editável o tempo todo. Se o link contiver
 * `?email=...`, esse valor será usado como preenchimento inicial, mas o usuário
 * pode alterá-lo livremente. O design utiliza um fundo personalizado com a arte
 * do Moedor e um cartão central para maior contraste.
 */
export default function Home() {
  // Estado local para o email digitado
  const [email, setEmail] = useState('');

  // Preenche o estado inicial com o parâmetro "email" da URL, se houver, apenas uma vez
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  // Verifica rapidamente se o email contém um "@" simples (pode ser aprimorado)
  const isEmailValid = email.includes('@');

  // Redireciona para o login OAuth2 do Discord passando o email como state
  const handleConnect = (e) => {
    e.preventDefault();
    const state = encodeURIComponent(email);
    window.location.href = `/api/discord/login?state=${state}`;
  };

  return (
    <div className={styles.background}>
      <div className={styles.card}>
        {/* Logo: usa a versão vertical para uma boa proporção */}
        <img
          src="/images/moedorvertical.jpg"
          alt="Moedor logo"
          className={styles.logo}
        />
        <h1 className={styles.title}>Conectar Discord</h1>
        <p className={styles.subtitle}>
          Se você acabou de comprar um plano no Hotmart, informe o email usado na compra para
          vincular sua conta do Discord e receber automaticamente o cargo correspondente.
        </p>
        <form onSubmit={handleConnect}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="seu_email@dominio.com"
            autoComplete="email"
          />
          <button
            type="submit"
            className={styles.button}
            disabled={!isEmailValid}
          >
            Conectar com Discord
          </button>
        </form>
      </div>
    </div>
  );
}