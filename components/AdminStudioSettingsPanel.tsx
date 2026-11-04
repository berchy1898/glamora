'use client';

import { useEffect, useState } from 'react';
import { SocialIcon, type SocialPlatform } from '@/components/SocialIcons';

type SocialLinksState = Record<SocialPlatform, string>;

type SubscriberItem = {
  email: string;
  subscribedAt: string;
};

type ContactMessageItem = {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  tipo: string;
  mensaje: string;
  createdAt: string;
};

const INITIAL_SOCIALS: SocialLinksState = {
  instagram: 'https://www.instagram.com/',
  facebook: 'https://www.facebook.com/',
  tiktok: 'https://www.tiktok.com/',
  x: 'https://x.com/',
  whatsapp: 'https://wa.me/',
  messenger: 'https://www.messenger.com/',
};

const SOCIAL_FIELDS: {
  id: SocialPlatform;
  label: string;
  placeholder: string;
}[] = [
  {
    id: 'instagram',
    label: 'INSTAGRAM OFICIAL',
    placeholder: 'https://www.instagram.com/glamorabolivia',
  },
  {
    id: 'facebook',
    label: 'FACEBOOK OFICIAL',
    placeholder: 'https://www.facebook.com/glamorabolivia',
  },
  {
    id: 'tiktok',
    label: 'TIKTOK OFICIAL',
    placeholder: 'https://www.tiktok.com/@glamorabolivia',
  },
  {
    id: 'x',
    label: 'X (TWITTER) OFICIAL',
    placeholder: 'https://x.com/glamorabolivia',
  },
  {
    id: 'whatsapp',
    label: 'WHATSAPP EDITORIAL',
    placeholder: 'https://wa.me/59170000000',
  },
  {
    id: 'messenger',
    label: 'MESSENGER OFICIAL',
    placeholder: 'https://m.me/glamorabolivia',
  },
];

export function AdminStudioSettingsPanel() {
  const [socials, setSocials] = useState<SocialLinksState>(INITIAL_SOCIALS);
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessageItem[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/studio-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (data.socials) {
          setSocials((prev) => ({ ...prev, ...data.socials }));
        }
        if (Array.isArray(data.subscribers)) {
          setSubscribers(data.subscribers);
        }
        if (Array.isArray(data.contactMessages)) {
          setContactMessages(data.contactMessages);
        }
        if (data.articleViews && typeof data.articleViews === 'object') {
          const sum = Object.values(data.articleViews as Record<string, number>).reduce(
            (acc, val) => acc + (Number(val) || 0),
            0
          );
          setTotalViews(sum);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleSaveSocials(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_socials', socials }),
      });
      if (res.ok) {
        setStatusMsg('Enlaces de redes oficiales actualizados en toda la revista ✓');
      } else {
        setStatusMsg('No se pudieron guardar los enlaces.');
      }
    } catch {
      setStatusMsg('Error de conexión al guardar enlaces.');
    } finally {
      setSaving(false);
    }
  }

  async function copySubscribers() {
    if (!subscribers.length) return;
    const list = subscribers.map((s) => s.email).join(', ');
    try {
      await navigator.clipboard.writeText(list);
      setStatusMsg(`${subscribers.length} correos copiados al portapapeles ✓`);
    } catch {
      setStatusMsg('No se pudo copiar al portapapeles.');
    }
  }

  async function deleteContactMessage(id: string) {
    try {
      const res = await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_contact_message', id }),
      });
      if (res.ok) {
        setContactMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      // ignore
    }
  }

  async function resetTestMetrics() {
    if (!window.confirm('¿Confirmas reiniciar el contador de visitas de prueba a cero?')) return;
    setStatusMsg('');
    try {
      const res = await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_test_metrics' }),
      });
      if (res.ok) {
        setTotalViews(0);
        setStatusMsg('Contadores de visitas de prueba restablecidos a cero ✓');
      }
    } catch {
      setStatusMsg('Error al reiniciar métricas.');
    }
  }

  async function clearTestInbox() {
    if (!window.confirm('¿Confirmas vaciar todos los mensajes de prueba recibidos en /contacto?')) return;
    setStatusMsg('');
    try {
      const res = await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_test_inbox' }),
      });
      if (res.ok) {
        setContactMessages([]);
        setStatusMsg('Bandeja de mensajes de prueba vaciada con éxito ✓');
      }
    } catch {
      setStatusMsg('Error al vaciar bandeja.');
    }
  }

  return (
    <section
      className="admin-panel"
      style={{ marginBottom: 22 }}
      aria-labelledby="studio-channels-heading"
    >
      {/* TARJETA DE SANITIZACIÓN PRE-LANZAMIENTO */}
      <div
        style={{
          padding: '16px 20px',
          border: '1px solid #d9b7bd',
          background: '#fff9fa',
          marginBottom: 20,
          display: 'grid',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 9, letterSpacing: '.2em', color: '#711c32', fontWeight: 600 }}>
              HERRAMIENTA PRE-LANZAMIENTO · MODO ESTRENO LIMPIO
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#4a3f41' }}>
              Restablece las métricas de lectura y vacía los correos de prueba recibidos para iniciar con estadísticas reales desde el día 1.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={resetTestMetrics}
              style={{
                padding: '9px 15px',
                border: '1px solid #711c32',
                background: '#fff',
                color: '#711c32',
                fontSize: 8.5,
                letterSpacing: '.18em',
                cursor: 'pointer',
              }}
            >
              REINICIAR VISTAS DEMO ({totalViews}) ↺
            </button>
            <button
              type="button"
              onClick={clearTestInbox}
              disabled={contactMessages.length === 0}
              style={{
                padding: '9px 15px',
                border: '1px solid #711c32',
                background: contactMessages.length ? '#711c32' : '#ccc',
                color: '#fff',
                fontSize: 8.5,
                letterSpacing: '.18em',
                cursor: contactMessages.length ? 'pointer' : 'not-allowed',
              }}
            >
              VACIAR BANDEJA DE PRUEBA ({contactMessages.length}) ✕
            </button>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        <div>
          <div className="eyebrow">
            CANALES OFICIALES · NEWSLETTER · CONSULTAS COMERCIALES · LECTURAS EN VIVO
          </div>
          <h2
            id="studio-channels-heading"
            style={{ font: '27px Georgia', fontWeight: 400, marginTop: 8, marginBottom: 4 }}
          >
            Redes oficiales, comunidad y bandeja comercial
          </h2>
          <p style={{ margin: 0, color: '#756b68', fontSize: 13 }}>
            Configura aquí las URLs de tus redes en el Header y Footer, consulta tus suscriptores del Newsletter y revisa los mensajes recibidos desde /contacto.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href="/admin/social-studio"
            className="button-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>✨</span>
            <span>SOCIAL STUDIO &amp; MARCA DE AGUA ↗</span>
          </a>

          <a
            href="/admin/issues"
            className="button-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>📖</span>
            <span>MAQUETAR REVISTA (THE ISSUES) ↗</span>
          </a>
        </div>
      </div>

      <form onSubmit={handleSaveSocials}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 12,
            marginBottom: 14,
          }}
        >
          {SOCIAL_FIELDS.map((field) => (
            <label
              key={field.id}
              style={{
                display: 'grid',
                gap: 6,
                padding: '10px 12px',
                border: '1px solid #e7ded5',
                background: '#fbfaf7',
                fontSize: 10,
                letterSpacing: '.14em',
                color: '#5a4e48',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <SocialIcon platform={field.id} size={13} />
                {field.label}
              </span>
              <input
                type="url"
                value={socials[field.id] || ''}
                onChange={(e) =>
                  setSocials((prev) => ({ ...prev, [field.id]: e.target.value }))
                }
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #dfd5cb',
                  background: '#ffffff',
                  fontSize: 12,
                  letterSpacing: 'normal',
                }}
              />
            </label>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            paddingTop: 6,
          }}
        >
          <button type="submit" className="button-primary" disabled={saving}>
            {saving ? 'GUARDANDO REDES...' : 'GUARDAR REDES OFICIALES ↗'}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: 12,
              color: '#5c514b',
            }}
          >
            <span>
              <strong>{totalViews}</strong> lecturas registradas (alimenta <em>En Tendencia</em>)
            </span>
            <span>·</span>
            <span>
              <strong>{subscribers.length}</strong>{' '}
              {subscribers.length === 1
                ? 'suscriptor en Newsletter'
                : 'suscriptores en Newsletter'}
            </span>
            {subscribers.length > 0 && (
              <button
                type="button"
                className="text-link"
                onClick={copySubscribers}
              >
                COPIAR CORREOS ({subscribers.length}) ↗
              </button>
            )}
          </div>
        </div>

        {statusMsg && (
          <p className="status" style={{ marginTop: 12 }}>
            {statusMsg}
          </p>
        )}
      </form>

      {contactMessages.length > 0 && (
        <div
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid #e7ded5',
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            BANDEJA DE ENTRADA · CONSULTAS RECIBIDAS DESDE /CONTACTO ({contactMessages.length})
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {contactMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: '12px 14px',
                  border: '1px solid #e7ded5',
                  background: '#fbf9f5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 14,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#711c32' }}>
                    {msg.tipo.toUpperCase()} ·{' '}
                    {new Date(msg.createdAt).toLocaleDateString('es-BO')}
                  </div>
                  <strong style={{ display: 'block', fontSize: 15, margin: '4px 0 2px' }}>
                    {msg.nombre} {msg.empresa ? `(${msg.empresa})` : ''} — {msg.email}
                  </strong>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4c433e' }}>
                    {msg.mensaje}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <a
                    href={`mailto:${msg.email}?subject=GLAMORA · Respuesta a tu consulta`}
                    className="text-link"
                  >
                    RESPONDER ↗
                  </a>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => deleteContactMessage(msg.id)}
                  >
                    ARCHIVAR ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
