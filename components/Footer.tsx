'use client';

import Link from 'next/link';
import { useState } from 'react';
import { GlamoraLogo } from '@/components/GlamoraLogo';
import { SocialIcon, useGlamoraSocialChannels } from '@/components/SocialIcons';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function Footer() {
  const socialChannels = useGlamoraSocialChannels();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleDispatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || submitting) return;
    setSubmitting(true);
    try {
      // 1. Guardar directo en Supabase
      const db = supabaseBrowser();
      await db.from('newsletter_subscribers').insert({ email: cleanEmail });
    } catch {
      // ignore
    }

    try {
      // 2. Guardar en API config
      await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', email: cleanEmail }),
      });
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
      setSubscribed(true);
      setEmail('');
    }
  }

  return (
    <footer className="footer">
      <section className="footer-dispatch" aria-labelledby="dispatch-heading">
        <div className="footer-dispatch-inner">
          <div className="footer-dispatch-copy">
            <span className="footer-dispatch-kicker">
              NEWSLETTER · GLAMORA
            </span>
            <h2 id="dispatch-heading">
              Recibe nuestras historias y ediciones en tu correo.
            </h2>
            <p>
              Entérate primero de cada nueva portada digital, coberturas de sociedad y artículos especiales de GLAMORA.
            </p>
          </div>

          <div className="footer-dispatch-action">
            {subscribed ? (
              <div className="footer-dispatch-thanks" role="status">
                <strong>Gracias por suscribirte a GLAMORA.</strong>
                <span>Te enviaremos nuestras próximas ediciones y coberturas destacadas.</span>
              </div>
            ) : (
              <form className="footer-dispatch-form" onSubmit={handleDispatchSubmit}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Escribe tu correo electrónico"
                  aria-label="Correo electrónico para suscribirse a GLAMORA"
                />
                <button type="submit" disabled={submitting}>
                  {submitting ? 'ENVIANDO...' : 'SUSCRIBIRME'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <div className="footer-main">
        <div className="footer-brand-block">
          <Link href="/" aria-label="Glamora, inicio" className="footer-logo-link">
            <GlamoraLogo variant="footer" tone="dark-bg" />
          </Link>
          <span>REVISTA DIGITAL · BOLIVIA</span>

          <div className="footer-social-icons" aria-label="Redes oficiales de GLAMORA">
            {socialChannels.map((ch) => (
              <a
                key={ch.id}
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social-icon-btn"
                aria-label={ch.name}
                title={ch.name}
              >
                <SocialIcon platform={ch.id} size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-column">
          <span>EXPLORAR</span>
          <Link href="/social">Glamora Social</Link>
          <Link href="/ediciones">The Issues · Archivo</Link>
          <Link href="/categoria/moda">Moda &amp; Estilo</Link>
          <Link href="/categoria/people">People</Link>
          <Link href="/categoria/cultura">Cultura</Link>
        </div>

        <div className="footer-column">
          <span>COLABORAR</span>
          <Link href="/publicidad">Publicidad y alianzas</Link>
          <Link href="/contacto">Contacto editorial</Link>
          <Link href="/contacto">Enviar una historia</Link>
          <Link href="/privacidad">Privacidad &amp; Legal</Link>
          <Link href="/admin/login">GLAMORA Studio</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} GLAMORA · BOLIVIA. TODOS LOS DERECHOS RESERVADOS.
        </span>
        <span>COCHABAMBA · LA PAZ · ORURO · POTOSÍ · SANTA CRUZ · THE WORLD</span>
      </div>
    </footer>
  );
}
