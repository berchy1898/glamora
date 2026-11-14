'use client';

import { useState } from 'react';

interface IssueAcquireModalProps {
  issueTitle: string;
  issueNumber: number | string;
  onClose: () => void;
}

export function IssueAcquireModal({
  issueTitle,
  issueNumber,
  onClose,
}: IssueAcquireModalProps) {
  const num = String(issueNumber).padStart(2, '0');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('Cochabamba');
  const [formato, setFormato] = useState('Edición Impresa de Colección');
  const [mensaje, setMensaje] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) {
      setError('Por favor completa tu nombre y correo electrónico.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const fullMessage = [
        `Edición solicitada: GLAMORA The Issue Nº ${num} — ${issueTitle}`,
        `Formato: ${formato}`,
        `Ciudad: ${ciudad}`,
        telefono.trim() ? `WhatsApp / Teléfono: ${telefono.trim()}` : null,
        mensaje.trim() ? `Notas: ${mensaje.trim()}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const res = await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'contact_message',
          nombre: nombre.trim(),
          empresa: ciudad,
          email: email.trim(),
          tipo: `Adquisición Edición Nº ${num} (${formato})`,
          mensaje: fullMessage,
        }),
      });
      if (!res.ok) {
        setError('No se pudo enviar tu solicitud. Intenta nuevamente.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Error de conexión al enviar la solicitud.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Adquirir Edición Nº ${num}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(21, 19, 26, .84)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: 'min(540px, 100%)',
          background: '#f7f5f0',
          color: '#15131a',
          border: '1px solid #d9b9a4',
          padding: '28px 26px',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            border: '1px solid rgba(21, 19, 26, .2)',
            background: 'transparent',
            color: '#15131a',
            padding: '5px 10px',
            fontSize: 10,
            letterSpacing: '.14em',
            cursor: 'pointer',
          }}
        >
          CERRAR ✕
        </button>

        <div style={{ fontSize: 8.5, letterSpacing: '.2em', color: '#711c32', fontWeight: 600 }}>
          GLAMORA THE ISSUE · Nº {num}
        </div>
        <h3 style={{ margin: '8px 0 6px', fontFamily: 'var(--font-editorial)', fontSize: 28, fontWeight: 400 }}>
          Adquirir esta edición
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'rgba(21, 19, 26, .74)', lineHeight: 1.55 }}>
          Solicita un ejemplar impreso de colección o acceso digital completo de <strong>{issueTitle}</strong>. Nuestro equipo te contactará por correo o WhatsApp.
        </p>

        {sent ? (
          <div style={{ padding: '18px 16px', border: '1px solid #d9b9a4', background: '#fffefa' }}>
            <strong style={{ display: 'block', color: '#711c32', fontSize: 12, letterSpacing: '.14em' }}>
              SOLICITUD RECIBIDA ✓
            </strong>
            <p style={{ margin: '8px 0 14px', fontSize: 14, lineHeight: 1.6 }}>
              Gracias, {nombre}. Registramos tu solicitud para la <strong>Edición Nº {num}</strong> ({formato}). Te responderemos muy pronto.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                background: '#15131a',
                color: '#f7f5f0',
                border: 'none',
                fontSize: 9.5,
                letterSpacing: '.16em',
                cursor: 'pointer',
              }}
            >
              VOLVER A LA REVISTA
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 5, fontSize: 9.5, letterSpacing: '.14em', color: '#711c32', fontWeight: 600 }}>
              FORMATO DESEADO
              <select
                value={formato}
                onChange={(e) => setFormato(e.target.value)}
                style={{ padding: '10px 12px', border: '1px solid rgba(21, 19, 26, .22)', background: '#fffefa', fontSize: 13, color: '#15131a' }}
              >
                <option value="Edición Impresa de Colección">Edición Impresa de Colección</option>
                <option value="Edición Digital VIP Completa">Edición Digital VIP Completa</option>
                <option value="Pack Impresa + Digital VIP">Pack Impresa + Digital VIP</option>
              </select>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'grid', gap: 5, fontSize: 9.5, letterSpacing: '.14em', color: '#711c32', fontWeight: 600 }}>
                NOMBRE COMPLETO *
                <input
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  style={{ padding: '10px 12px', border: '1px solid rgba(21, 19, 26, .22)', background: '#fffefa', fontSize: 13 }}
                />
              </label>
              <label style={{ display: 'grid', gap: 5, fontSize: 9.5, letterSpacing: '.14em', color: '#711c32', fontWeight: 600 }}>
                CIUDAD
                <input
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Cochabamba, La Paz, Santa Cruz..."
                  style={{ padding: '10px 12px', border: '1px solid rgba(21, 19, 26, .22)', background: '#fffefa', fontSize: 13 }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <label style={{ display: 'grid', gap: 5, fontSize: 9.5, letterSpacing: '.14em', color: '#711c32', fontWeight: 600 }}>
                CORREO ELECTRÓNICO *
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  style={{ padding: '10px 12px', border: '1px solid rgba(21, 19, 26, .22)', background: '#fffefa', fontSize: 13 }}
                />
              </label>
              <label style={{ display: 'grid', gap: 5, fontSize: 9.5, letterSpacing: '.14em', color: '#711c32', fontWeight: 600 }}>
                WHATSAPP / TELÉFONO
                <input
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+591 ..."
                  style={{ padding: '10px 12px', border: '1px solid rgba(21, 19, 26, .22)', background: '#fffefa', fontSize: 13 }}
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: 5, fontSize: 9.5, letterSpacing: '.14em', color: '#711c32', fontWeight: 600 }}>
              COMENTARIO O DIRECCIÓN DE ENTREGA (OPCIONAL)
              <textarea
                rows={2}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Indícanos cantidad de ejemplares o detalles de envío…"
                style={{ padding: '10px 12px', border: '1px solid rgba(21, 19, 26, .22)', background: '#fffefa', fontSize: 13 }}
              />
            </label>

            {error && <p style={{ margin: 0, color: '#711c32', fontSize: 12 }}>{error}</p>}

            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 4,
                padding: '12px 20px',
                background: '#711c32',
                color: '#f7f5f0',
                border: '1px solid #d9b9a4',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '.18em',
                cursor: 'pointer',
              }}
            >
              {busy ? 'ENVIANDO SOLICITUD…' : 'SOLICITAR EDICIÓN ↗'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
