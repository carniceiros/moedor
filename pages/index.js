// pages/index.js
import { useState } from "react";

export default function Home() {
  // NADA de router/query. Apenas state local.
  const [email, setEmail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    // verificação simples (sem regex): precisa ter "@"
    const ok = email.includes("@");
    if (!ok) {
      alert("Digite um e-mail válido.");
      return;
    }
    // manda pro login do Discord com state = e-mail
    window.location.href = "/api/discord/login?state=" + encodeURIComponent(email);
  }

  return (
    <main style={{ maxWidth: 640, margin: "4rem auto", fontFamily: "system-ui" }}>
      <h1 style={{ textAlign: "center" }}>Conectar Discord</h1>
      <p style={{ textAlign: "center" }}>
        Digite seu e-mail da compra para vincular ao Discord.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 24 }}>
        <input
          type="email"
          autoComplete="email"
          placeholder="seu_email@dominio.com"
          value={email}                       {/* controlado só pelo state */}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: "10px 12px", width: "60%" }}
        />
        <button type="submit" style={{ padding: "10px 16px" }}>
          Conectar com Discord
        </button>
      </form>
    </main>
  );
}
