'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase-browser';

export function ContactFormClient() {
  const [nombre, setNombre] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [email, setEmail] = useState('');
  const [tipo, setTipo] = useState('Publicidad y patrocinio');
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setErrorMsg('');

    try {
      // 1. Guardar directamente en Supabase contact_leads
      const db = supabaseBrowser();
      await db.from('contact_leads').insert({
        name: nombre.trim(),
        company: empresa.trim() || null,
        email: email.trim(),
        inquiry_type: tipo,
        message: mensaje.trim(),
      });
    } catch {
      // ignore
    }

    try {
      // 2. Notificar al endpoint de Studio
      const res = await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'contact_message',
          nombre,
          empresa,
          email,
          tipo,
          mensaje,
        }),
      });

      setSent(true);
      setNombre('');
      setEmpresa('');
      setEmail('');
      setMensaje('');
    } catch {
      setErrorMsg('Error de conexión al enviar la consulta.');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div
        style={{
          padding: '28px 24px',
          border: '1px solid #d9cfc6',
          background: '#fbf9f5',
          marginTop: 14,
        }}
        role="status"
      >
        <div className="eyebrow" style={{ marginBottom: 8 }}>
          MESA EDITORIAL &amp; COMERCIAL · GLAMORA
        </div>
        <h3 style={{ font: '400 28px/1.15 var(--font-editorial)', margin: '0 0 10px' }}>
          Hemos recibido tu mensaje en GLAMORA Studio.
        </h3>
        <p style={{ margin: '0 0 18px', color: '#5f554f', fontSize: 14, lineHeight: 1.65 }}>
          Nuestro equipo editorial y comercial revisará tu propuesta y se pondrá en contacto contigo a la brevedad.
        </p>
        <button
          type="button"
          className="button-primary"
          onClick={() => setSent(false)}
        >
          ENVIAR OTRA CONSULTA
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        NOMBRE
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          placeholder="Tu nombre completo"
        />
      </label>

      <label>
        EMPRESA O MARCA
        <input
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          placeholder="Nombre de tu empresa o proyecto"
        />
      </label>

      <label>
        CORREO ELECTRÓNICO
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="nombre@empresa.com"
        />
      </label>

      <label>
        TIPO DE CONSULTA
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option>Publicidad y patrocinio</option>
          <option>Propuesta editorial</option>
          <option>Prensa y eventos (Glamora Social)</option>
          <option>Colaboración de marca</option>
          <option>Otro</option>
        </select>
      </label>

      <label>
        MENSAJE
        <textarea
          rows={5}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          required
          placeholder="Cuéntanos sobre tu propuesta, evento o consulta"
        />
      </label>

      {errorMsg && (
        <p className="status admin-feedback-error" role="alert">
          {errorMsg}
        </p>
      )}

      <button type="submit" className="button-primary" disabled={sending}>
        {sending ? 'ENVIANDO CONSULTA…' : 'ENVIAR CONSULTA ↗'}
      </button>
    </form>
  );
}
