'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import {
  CoverageDraftLinkError,
  ensureCoverageDraftLink,
} from '@/lib/coverage-draft-link';
import {
  formatBoliviaCalendarDate,
  getBoliviaDateKey,
  getCoverageStatusLabel,
  type PersistedCoverageStatus,
} from '@/lib/editorial-utils';

type Coverage = {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  city: string;
  venue: string | null;
  category: string;
  lead_name: string | null;
  photographer: string | null;
  status: string;
  notes: string | null;
  linked_article_slug: string | null;
};

const emptyForm = {
  title: '',
  event_date: '',
  event_time: '',
  city: 'Cochabamba',
  venue: '',
  category: 'Social',
  lead_name: '',
  photographer: '',
  status: 'pending',
  notes: '',
  linked_article_slug: '',
};

function toPersistedCoverageStatus(status: string): PersistedCoverageStatus {
  if (status === 'in_review' || status === 'published') return 'article_created';
  if (status === 'confirmed' || status === 'preparing' || status === 'completed' || status === 'article_created') return status;
  return 'pending';
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#f1eee9', color: '#665b55' },
  confirmed: { bg: '#e9eef3', color: '#344e63' },
  preparing: { bg: '#f3eadb', color: '#76552b' },
  completed: { bg: '#e7eee7', color: '#36583b' },
  article_created: { bg: '#eee5eb', color: '#6b3e5a' },
  in_review: { bg: '#eee5eb', color: '#6b3e5a' },
  published: { bg: '#e7eee7', color: '#36583b' },
};

export default function CoverageAgendaPage() {
  const router = useRouter();
  const db = supabaseBrowser();
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<Coverage[]>([]);
  const [articles, setArticles] = useState<Array<{ slug: string; title: string }>>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: { user }, error } = await db.auth.getUser();
        if (error) throw error;
        if (!user || user.email?.toLowerCase() !== 'legarage1014@gmail.com') {
          router.replace('/admin/login');
          return;
        }
        if (!alive) return;
        setReady(true);
        const loadedRows = await load();
        const { data, error: articleError } = await db.from('articles').select('slug,title').order('created_at', { ascending: false });
        if (articleError) setLoadError((current) => [current, `No se pudieron cargar los artículos para vincular: ${articleError.message}`].filter(Boolean).join(' · '));
        if (alive) {
          setArticles(data || []);
          const requestedId = new URLSearchParams(window.location.search).get('edit');
          const requestedCoverage = requestedId
            ? loadedRows.find((row) => row.id === requestedId)
            : null;
          if (requestedCoverage) edit(requestedCoverage);
        }
      }
      catch (error) {
        if (alive) {
          setAuthError(error instanceof Error ? error.message : 'No se pudo verificar el acceso.');
          setReady(true);
          setLoading(false);
        }
      }
    })();
    return () => { alive = false; };
  }, []);

  async function load(): Promise<Coverage[]> {
    setLoading(true);
    setLoadError('');
    const { data, error } = await db
      .from('coverage_assignments')
      .select('*')
      .order('event_date', { ascending: true });
    if (error) {
      setLoadError(`No se pudieron cargar las coberturas: ${error.message}`);
      setLoading(false);
      return [];
    }
    const loaded = (data || []) as Coverage[];
    setRows(loaded);
    setLoading(false);
    return loaded;
  }

  function update<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((old) => ({ ...old, [key]: value }));
  }

  function edit(row: Coverage) {
    setEditingId(row.id);
    setForm({
      title: row.title || '',
      event_date: row.event_date || '',
      event_time: row.event_time?.slice(0, 5) || '',
      city: row.city || 'Cochabamba',
      venue: row.venue || '',
      category: row.category || 'Social',
      lead_name: row.lead_name || '',
      photographer: row.photographer || '',
      status: row.status || 'pending',
      notes: row.notes || '',
      linked_article_slug: row.linked_article_slug || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const payload = {
        ...form,
        status: toPersistedCoverageStatus(form.status),
        event_time: form.event_time || null,
        venue: form.venue || null,
        lead_name: form.lead_name || null,
        photographer: form.photographer || null,
        notes: form.notes || null,
        linked_article_slug: form.linked_article_slug || null,
      };

      let coverageId = editingId;
      let coverageError: { message: string } | null = null;

      if (editingId) {
        const result = await db
          .from('coverage_assignments')
          .update(payload)
          .eq('id', editingId)
          .select('id')
          .maybeSingle();
        coverageError = result.error || (!result.data
          ? { message: 'No se confirmó que la cobertura se haya actualizado.' }
          : null);
      } else {
        const result = await db
          .from('coverage_assignments')
          .insert(payload)
          .select('id')
          .single();
        coverageError = result.error;
        coverageId = result.data?.id ?? null;
      }

      if (coverageError || !coverageId) {
        setMessage(`No se pudo guardar la cobertura: ${coverageError?.message || 'No se recibió el identificador.'}`);
        return;
      }

      // Si la cobertura nueva ya fue creada, conservar su ID en el formulario.
      // Un fallo posterior debe reintentar como edición, no insertar otra cobertura.
      if (!editingId) setEditingId(coverageId);

      let createdDraft = false;
      let recoveredDraft = false;

      // Al pasar a En producción, crear un único borrador vinculado.
      // Si ya existe un vínculo, nunca se crea otro artículo.
      if (form.status === 'preparing' && !form.linked_article_slug && coverageId) {
        try {
          const result = await ensureCoverageDraftLink({
            coverageId,
            title: form.title,
            eventDate: form.event_date,
            category: form.category,
            city: form.city,
            venue: form.venue,
          }, {
            findBySlug: async (slug) => {
              const { data, error } = await db
                .from('articles')
                .select('slug,event_name,event_date,is_published')
                .eq('slug', slug)
                .maybeSingle();
              return { data, error: error?.message || null };
            },
            findLegacyCandidates: async (idSuffix) => {
              const { data, error } = await db
                .from('articles')
                .select('slug,event_name,event_date,is_published')
                .like('slug', `%-${idSuffix}`)
                .limit(2);
              return { data: data || [], error: error?.message || null };
            },
            createDraft: async (draft) => {
              const { error } = await db.from('articles').insert(draft);
              return { error: error?.message || null };
            },
            saveCoverageLink: async (id, slug) => {
              const { data, error } = await db
                .from('coverage_assignments')
                .update({ linked_article_slug: slug })
                .eq('id', id)
                .select('id')
                .maybeSingle();
              return {
                error: error?.message || (!data
                  ? 'No se confirmó que la cobertura haya recibido el vínculo.'
                  : null),
              };
            },
          });
          createdDraft = result.created;
          recoveredDraft = result.recovered;
        } catch (error) {
          const detail = error instanceof Error ? error.message : 'Error inesperado.';
          if (error instanceof CoverageDraftLinkError) {
            const stageMessage = error.stage === 'create'
              ? 'no se pudo crear el borrador'
              : error.stage === 'link'
                ? `el borrador ${error.slug || ''} existe, pero no se pudo completar el vínculo`
                : 'no se pudo comprobar o recuperar un borrador previo';
            setMessage(`La cobertura se guardó, pero ${stageMessage}: ${detail}. Tus datos se conservaron. Reintenta guardar para continuar o vincula el artículo manualmente.`);
          } else {
            setMessage(`La cobertura se guardó, pero no se pudo completar el artículo vinculado: ${detail}. Tus datos se conservaron; puedes reintentar.`);
          }
          try {
            await load();
            const { data: articleData, error: articleError } = await db
              .from('articles')
              .select('slug,title')
              .order('created_at', { ascending: false });
            if (articleError) {
              setLoadError(`La cobertura se conservó, pero no se pudo actualizar la lista de artículos: ${articleError.message}`);
            } else {
              setArticles(articleData || []);
            }
          } catch {
            setLoadError('La cobertura se conservó, pero no se pudieron actualizar las listas. Reintenta la carga antes de continuar.');
          }
          return;
        }
      }

      setMessage(
        createdDraft
          ? 'Cobertura actualizada. Se creó automáticamente un borrador en GLAMORA Studio y quedó vinculado.'
          : recoveredDraft
            ? 'Cobertura actualizada. Se recuperó el borrador pendiente y quedó vinculado sin duplicarlo.'
          : editingId
            ? 'Cobertura actualizada correctamente.'
            : 'Cobertura registrada correctamente.'
      );
      reset();
      await load();
      const { data: articleData } = await db
        .from('articles')
        .select('slug,title')
        .order('created_at', { ascending: false });
      setArticles(articleData || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Ocurrió un error al guardar la cobertura.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta cobertura? Esta acción no se puede deshacer.')) return;
    const { error } = await db.from('coverage_assignments').delete().eq('id', id);
    setMessage(error ? `No se pudo eliminar: ${error.message}` : 'Cobertura eliminada.');
    if (!error) await load();
  }

  if (!ready) return <main className="admin-shell"><div className="admin-state">Verificando acceso…</div></main>;
  if (authError) return (
    <main className="admin-shell">
      <div className="admin-content admin-state admin-state-error" role="alert">
        <div className="eyebrow">GLAMORA STUDIO</div>
        <h1>No se pudo verificar el acceso.</h1>
        <p>{authError}</p>
        <button className="button-primary" onClick={() => window.location.reload()}>INTENTAR DE NUEVO</button>
      </div>
    </main>
  );

  const today = getBoliviaDateKey();
  const upcomingStatuses = new Set(['pending', 'confirmed', 'preparing']);
  const completedStatuses = new Set(['completed', 'article_created', 'in_review', 'published']);
  const upcoming = rows.filter((row) => row.event_date >= today && upcomingStatuses.has(row.status)).length;
  const completed = rows.filter((row) => completedStatuses.has(row.status)).length;

  return (
    <main className="admin-shell admin-agenda">
      <div className="admin-top">
        <strong className="admin-wordmark">GLAMORA <span>STUDIO</span></strong>
        <div className="admin-top-nav">
          <a className="text-link" href="/admin">← VOLVER AL DASHBOARD</a>
          <a className="text-link" href="/admin/produccion">CENTRO DE PRODUCCIÓN ↗</a>
          <button className="button-primary" onClick={async () => { await db.auth.signOut(); router.replace('/admin/login'); }}>
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      <div className="admin-content">
        <div className="eyebrow">GLAMORA EDITORIAL DESK</div>
        <h1 className="admin-page-title">Agenda de coberturas</h1>
        <p>Planifica eventos, asigna responsables y convierte cada cobertura en una historia editorial.</p>

        <section className="admin-panel admin-agenda-summary" style={{ marginBottom: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            <div className="admin-stat-card" style={{ border: '1px solid #e7ded5', background: '#fbfaf7', padding: 16 }}>
              <div className="eyebrow">TOTAL DE COBERTURAS</div>
              <div style={{ font: '32px Georgia', marginTop: 8 }}>{rows.length}</div>
            </div>
            <div className="admin-stat-card" style={{ border: '1px solid #e7ded5', background: '#fbfaf7', padding: 16 }}>
              <div className="eyebrow">PRÓXIMAS</div>
              <div style={{ font: '32px Georgia', marginTop: 8 }}>{upcoming}</div>
            </div>
            <div className="admin-stat-card" style={{ border: '1px solid #e7ded5', background: '#fbfaf7', padding: 16 }}>
              <div className="eyebrow">REALIZADAS / CON ARTÍCULO</div>
              <div style={{ font: '32px Georgia', marginTop: 8 }}>{completed}</div>
            </div>
          </div>
        </section>

        {loadError && (
          <div className="admin-feedback-error" role="alert">
            <p className="status">{loadError}</p>
            <button type="button" className="text-link" onClick={() => void load()}>INTENTAR DE NUEVO ↻</button>
          </div>
        )}
        {loading && <p className="status admin-feedback" role="status">Cargando agenda editorial…</p>}
        {message && <p className="status" role="status">{message}</p>}

        <section className="admin-panel admin-agenda-form" style={{ marginBottom: 22 }}>
          <div className="eyebrow">PLANIFICACIÓN DE PRODUCCIÓN</div>
          <h2 style={{ font: '27px Georgia', fontWeight: 400 }}>{editingId ? 'Editar cobertura' : 'Registrar nueva cobertura'}</h2>
          <form className="admin-form" onSubmit={save}>
            <label className="wide">NOMBRE DEL EVENTO
              <input required value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Ej. Lanzamiento de colección Primavera" />
            </label>
            <label>FECHA
              <input required type="date" value={form.event_date} onChange={(e) => update('event_date', e.target.value)} />
            </label>
            <label>HORA
              <input type="time" value={form.event_time} onChange={(e) => update('event_time', e.target.value)} />
            </label>
            <label>CIUDAD
              <select value={form.city} onChange={(e) => update('city', e.target.value)}>
                {['Cochabamba', 'La Paz', 'Santa Cruz', 'Oruro', 'Potosí', 'Internacional'].map((city) => <option key={city}>{city}</option>)}
              </select>
            </label>
            <label>LUGAR / VENUE
              <input value={form.venue} onChange={(e) => update('venue', e.target.value)} placeholder="Nombre y dirección del lugar" />
            </label>
            <label>CATEGORÍA EDITORIAL
              <select value={form.category} onChange={(e) => update('category', e.target.value)}>
                {['Social', 'Moda', 'Belleza', 'People', 'Viajes', 'Cultura', 'Gastronomía', 'Mundo', 'Lifestyle', 'Society', 'The Table', 'Wellness'].map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>RESPONSABLE DE COBERTURA
              <input value={form.lead_name} onChange={(e) => update('lead_name', e.target.value)} placeholder="Editor o coordinador" />
            </label>
            <label>FOTÓGRAFO / EQUIPO
              <input value={form.photographer} onChange={(e) => update('photographer', e.target.value)} placeholder="Nombre del fotógrafo o equipo" />
            </label>
            <label>ESTADO DE COBERTURA
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                <option value="pending">Por confirmar</option>
                <option value="confirmed">Confirmada</option>
                <option value="preparing">En preparación</option>
                <option value="completed">Realizada</option>
                <option value="article_created">Artículo creado / En producción</option>
                {(form.status === 'in_review' || form.status === 'published') && (
                  <option value={form.status} disabled>{getCoverageStatusLabel(form.status)} · estado heredado</option>
                )}
              </select>
            </label>
            <label>VINCULAR ARTÍCULO (OPCIONAL)
              <select value={form.linked_article_slug} onChange={(e) => update('linked_article_slug', e.target.value)}>
                <option value="">Sin artículo vinculado</option>
                {articles.map((article) => <option key={article.slug} value={article.slug}>{article.title}</option>)}
              </select>
            </label>
            <label className="wide">NOTAS E INDICACIONES
              <textarea rows={4} value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Brief, horarios de llegada, contactos, momentos clave, requisitos fotográficos…" />
            </label>
            <div className="wide" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="button-primary" disabled={busy}>{busy ? 'GUARDANDO…' : editingId ? 'GUARDAR CAMBIOS ↗' : 'REGISTRAR COBERTURA ↗'}</button>
              {editingId && <button type="button" className="button-primary" onClick={reset} disabled={busy}>CANCELAR EDICIÓN</button>}
            </div>
          </form>
        </section>

        <section className="admin-panel admin-agenda-list">
          <div className="eyebrow">AGENDA EDITORIAL</div>
          <h2 style={{ font: '27px Georgia', fontWeight: 400 }}>Coberturas registradas</h2>
          {loading ? <p className="admin-empty-state">Cargando coberturas…</p> : loadError && rows.length === 0 ? (
            <p className="admin-empty-state">No fue posible mostrar la agenda. Revisa el mensaje anterior e inténtalo de nuevo.</p>
          ) : rows.length === 0 ? <p className="admin-empty-state">No hay coberturas registradas todavía. Utiliza el formulario para crear la primera.</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-list">
                <thead><tr><th>Evento</th><th>Fecha</th><th>Lugar</th><th>Responsable</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.title}</strong><br /><small>{row.category}{row.linked_article_slug ? ` · ${row.linked_article_slug}` : ''}</small></td>
                      <td>{formatBoliviaCalendarDate(row.event_date, { day: '2-digit', month: 'short', year: 'numeric' })}{row.event_time ? <><br /><small>{row.event_time.slice(0,5)}</small></> : null}</td>
                      <td>{row.venue || '—'}<br /><small>{row.city}</small></td>
                      <td>{row.lead_name || '—'}<br /><small>{row.photographer || ''}</small></td>
                      <td><span style={{ display: 'inline-block', padding: '6px 9px', background: statusColors[row.status]?.bg || '#f1eee9', color: statusColors[row.status]?.color || '#665b55', fontSize: 10, letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{getCoverageStatusLabel(row.status)}</span></td>
                      <td><button className="text-link" onClick={() => edit(row)}>EDITAR</button>{' '}<button className="text-link" onClick={() => remove(row.id)}>ELIMINAR</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
