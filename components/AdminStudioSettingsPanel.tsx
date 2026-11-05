'use client';

import { useEffect, useState } from 'react';
import { SocialIcon, type SocialPlatform } from '@/components/SocialIcons';
import { supabaseBrowser } from '@/lib/supabase-browser';

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
  const [loadingData, setLoadingData] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    let active = true;
    const db = supabaseBrowser();

    async function loadAll() {
      try {
        // 1. Cargar enlaces de redes guardados en Supabase
        const { data: socialRow } = await db
          .from('studio_settings')
          .select('value')
          .eq('key', 'social_links')
          .maybeSingle();

        if (active && socialRow?.value && typeof socialRow.value === 'object') {
          setSocials((prev) => ({ ...prev, ...socialRow.value }));
        }

        // 2. Cargar vistas y diseños desde api
        try {
          const apiRes = await fetch('/api/studio-config');
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (active && apiData?.articleViews) {
              const sum = Object.values(apiData.articleViews as Record<string, number>).reduce(
                (acc, val) => acc + (Number(val) || 0),
                0
              );
              setTotalViews(sum);
            }
          }
        } catch {
          // ignore
        }

        // 3. Cargar suscriptores del newsletter directamente de Supabase
        const { data: subsData } = await db
          .from('newsletter_subscribers')
          .select('*')
          .order('subscribed_at', { ascending: false });

        if (active && Array.isArray(subsData)) {
          setSubscribers(
            subsData.map((s: any) => ({
              email: s.email,
              subscribedAt: s.subscribed_at,
            }))
          );
        }

        // 4. Cargar mensajes de contacto directamente de Supabase
        const { data: leadsData } = await db
          .from('contact_leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (active && Array.isArray(leadsData)) {
          setContactMessages(
            leadsData.map((l: any) => ({
              id: l.id,
              nombre: l.name,
              empresa: l.company || '',
              email: l.email,
              tipo: l.inquiry_type || 'General',
              mensaje: l.message,
              createdAt: l.created_at,
            }))
          );
        }
      } catch (err) {
        console.error('Error cargando datos de Studio:', err);
      } finally {
        if (active) setLoadingData(false);
      }
    }

    loadAll();

    return () => {
      active = false;
    };
  }, []);

  async function handleSaveSocials(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');
    try {
      const db = supabaseBrowser();
      // Guardar directamente en Supabase studio_settings
      const { error: supaErr } = await db.from('studio_settings').upsert({
        key: 'social_links',
        value: socials,
        updated_at: new Date().toISOString(),
      });

      if (supaErr) {
        console.warn('Aviso Supabase:', supaErr.message);
      }

      // Notificar también al endpoint local
      await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_socials', socials }),
      });

      setStatusMsg('Enlaces de redes oficiales guardados y activos en toda la revista ✓');
    } catch (err: any) {
      setStatusMsg('Error al guardar: ' + (err?.message || 'Error de conexión'));
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
      const db = supabaseBrowser();
      await db.from('contact_leads').delete().eq('id', id);
      await fetch('/api/studio-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_contact_message', id }),
      });
      setContactMessages((prev) => prev.filter((m) => m.id !== id));
      setStatusMsg('Mensaje archivado con éxito ✓');
    } catch {
      setStatusMsg('No se pudo archivar el mensaje.');
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
      const db = supabaseBrowser();
      for (const msg of contactMessages) {
        await db.from('contact_leads').delete().eq('id', msg.id);
      }
      setContactMessages([]);
      setStatusMsg('Bandeja de mensajes de prueba vaciada con éxito ✓');
    } catch {
      setStatusMsg('Error al vaciar bandeja.');
    }
  }

  return (
    <section
      className="admin-panel"
      style={{ marginBottom: 28 }}
      aria-labelledby="studio-channels-heading"
    >
      {/* 1. CABECERA PRINCIPAL Y ACCESOS RÁPIDOS */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div>
          <div className="eyebrow">GLAMORA STUDIO · CONTROL OPERATIVO</div>
          <h2
            id="studio-channels-heading"
            style={{ font: '27px Georgia', fontWeight: 400, marginTop: 6, marginBottom: 4 }}
          >
            Redes oficiales, comunidad y bandeja de entrada
          </h2>
          <p style={{ margin: 0, color: '#756b68', fontSize: 13 }}>
            Gestiona los enlaces de redes sociales, consulta los suscriptores al Newsletter y revisa las propuestas recibidas desde /contacto.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href="/admin/social-studio"
            className="button-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>✨</span>
            <span>SOCIAL STUDIO &amp; MARCA ↗</span>
          </a>

          <a
            href="/admin/issues"
            className="button-primary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <span>📖</span>
            <span>REVISTA DIGITAL (THE ISSUES) ↗</span>
          </a>
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            padding: '10px 14px',
            background: '#f2f8f3',
            border: '1px solid #cce5d2',
            color: '#1e6833',
            fontSize: 12.5,
            marginBottom: 16,
          }}
        >
          {statusMsg}
        </div>
      )}

      {/* 2. FORMULARIO DE REDES SOCIALES OFICIALES */}
      <div style={{ marginBottom: 26, paddingBottom: 22, borderBottom: '1px solid #e7ded5' }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          1. ENLACES DE REDES SOCIALES (HEADER &amp; FOOTER)
        </div>
        <form onSubmit={handleSaveSocials}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
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

          <button type="submit" className="button-primary" disabled={saving}>
            {saving ? 'GUARDANDO REDES...' : 'GUARDAR REDES OFICIALES ↗'}
          </button>
        </form>
      </div>

      {/* 3. BANDEJA DE ENTRADA · CONSULTAS DE CONTACTO & ALIANZAS */}
      <div style={{ marginBottom: 26, paddingBottom: 22, borderBottom: '1px solid #e7ded5' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="eyebrow">
              2. BANDEJA DE ENTRADA · CONSULTAS DESDE /CONTACTO ({contactMessages.length})
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#756b68' }}>
              Mensajes y solicitudes de publicidad enviados por marcas y lectores.
            </p>
          </div>
          {contactMessages.length > 0 && (
            <button
              type="button"
              className="text-link"
              onClick={clearTestInbox}
              style={{ color: '#711c32' }}
            >
              VACIAR MENSAJES DE PRUEBA ✕
            </button>
          )}
        </div>

        {loadingData ? (
          <p style={{ color: '#888', fontSize: 12.5 }}>Cargando consultas de contacto…</p>
        ) : contactMessages.length === 0 ? (
          <div
            style={{
              padding: '24px 20px',
              border: '1px dashed #d9cfc6',
              background: '#fbfaf8',
              textAlign: 'center',
              color: '#776e68',
              fontSize: 13,
            }}
          >
            📭 Todavía no hay consultas en la bandeja. Cuando alguien envíe un mensaje desde /contacto aparecerá aquí de inmediato.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {contactMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  padding: '14px 16px',
                  border: '1px solid #e7ded5',
                  background: '#fcfbfa',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 340px' }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '.16em', color: '#711c32', fontWeight: 600 }}>
                    {msg.tipo.toUpperCase()} ·{' '}
                    {new Date(msg.createdAt).toLocaleDateString('es-BO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <strong style={{ display: 'block', fontSize: 15, margin: '5px 0 3px', color: '#17151a' }}>
                    {msg.nombre} {msg.empresa ? `(${msg.empresa})` : ''} —{' '}
                    <a href={`mailto:${msg.email}`} style={{ color: '#711c32', textDecoration: 'none' }}>
                      {msg.email}
                    </a>
                  </strong>
                  <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#443c37', lineHeight: 1.6 }}>
                    {msg.mensaje}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignSelf: 'center' }}>
                  <a
                    href={`mailto:${msg.email}?subject=GLAMORA · Respuesta a tu consulta de ${encodeURIComponent(msg.tipo)}`}
                    className="button-primary"
                    style={{ fontSize: 9, padding: '7px 12px', textDecoration: 'none' }}
                  >
                    RESPONDER ✉
                  </a>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => deleteContactMessage(msg.id)}
                    style={{ color: '#711c32' }}
                  >
                    ARCHIVAR ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SUSCRIPTORES AL NEWSLETTER */}
      <div style={{ marginBottom: 26, paddingBottom: 22, borderBottom: '1px solid #e7ded5' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="eyebrow">
              3. COMUNIDAD · SUSCRIPTORES AL NEWSLETTER ({subscribers.length})
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#756b68' }}>
              Lectores suscritos desde el pie de página de la revista.
            </p>
          </div>
          {subscribers.length > 0 && (
            <button
              type="button"
              className="button-primary"
              onClick={copySubscribers}
              style={{ fontSize: 9, padding: '7px 14px' }}
            >
              COPIAR TODOS LOS CORREOS ({subscribers.length}) ↗
            </button>
          )}
        </div>

        {loadingData ? (
          <p style={{ color: '#888', fontSize: 12.5 }}>Cargando suscriptores…</p>
        ) : subscribers.length === 0 ? (
          <div
            style={{
              padding: '24px 20px',
              border: '1px dashed #d9cfc6',
              background: '#fbfaf8',
              textAlign: 'center',
              color: '#776e68',
              fontSize: 13,
            }}
          >
            ✉ Aún no hay suscriptores registrados en el Newsletter.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              maxHeight: 220,
              overflowY: 'auto',
              padding: '12px 14px',
              border: '1px solid #e7ded5',
              background: '#fbfaf7',
            }}
          >
            {subscribers.map((sub, i) => (
              <span
                key={`${sub.email}-${i}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  background: '#ffffff',
                  border: '1px solid #dfd5cb',
                  fontSize: 11.5,
                  color: '#2a2421',
                  borderRadius: 2,
                }}
              >
                <strong>{sub.email}</strong>
                <small style={{ color: '#888', fontSize: 9.5 }}>
                  {new Date(sub.subscribedAt).toLocaleDateString('es-BO')}
                </small>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 5. HERRAMIENTA AVANZADA PRE-LANZAMIENTO */}
      <div
        style={{
          padding: '14px 18px',
          border: '1px solid #e0c8ce',
          background: '#fffbfc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span style={{ fontSize: 9, letterSpacing: '.18em', color: '#711c32', fontWeight: 600 }}>
            HERRAMIENTA PRE-LANZAMIENTO · MODO ESTRENO LIMPIO
          </span>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#544649' }}>
            Métricas de lectura registradas en el sitio: <strong>{totalViews} lecturas</strong>. Puedes reiniciar a cero antes del debut oficial.
          </p>
        </div>
        <button
          type="button"
          onClick={resetTestMetrics}
          style={{
            padding: '8px 14px',
            border: '1px solid #711c32',
            background: '#ffffff',
            color: '#711c32',
            fontSize: 8.5,
            letterSpacing: '.18em',
            cursor: 'pointer',
          }}
        >
          REINICIAR CONTADOR DE VISITAS (0) ↺
        </button>
      </div>
    </section>
  );
}
