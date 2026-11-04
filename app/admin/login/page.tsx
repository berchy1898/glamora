'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlamoraLogo } from '@/components/GlamoraLogo';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const { error: authError } = await supabaseBrowser().auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-shell admin-login-shell">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <div className="admin-login-logo-wrap">
          <GlamoraLogo variant="login" tone="light-bg" />
        </div>

        <div className="admin-login-kicker">GLAMORA STUDIO · PRIVATE ACCESS</div>
        <h1 id="admin-login-title" className="admin-login-title">Bienvenido.</h1>
        <p className="admin-login-copy">Acceso exclusivo para el administrador de Glamora.</p>

        <form className="admin-form admin-login-form" onSubmit={submit}>
          <label htmlFor="admin-email">
            Correo
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label htmlFor="admin-password">
            Contraseña
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button className="button-primary" type="submit" disabled={busy}>
            {busy ? 'INGRESANDO…' : 'INGRESAR AL ESTUDIO ↗'}
          </button>

          {error && <p className="admin-login-error" role="alert">{error}</p>}
        </form>
      </section>
    </main>
  );
}
