'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import {
  COVERAGE_STATUS_LABELS,
  EDITORIAL_STATUS_LABELS,
  formatBoliviaCalendarDate,
  getCoverageStatusLabel,
} from '@/lib/editorial-utils';
import {
  findLinkedArticle,
  resolveProductionStage,
  type ProductionStage,
} from '@/lib/production-utils';

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

type Article = {
  id: string;
  title: string;
  slug: string;
  cover_image: string | null;
  editorial_status: string | null;
  is_published: boolean;
  published_at: string | null;
};

type ProductionItem = {
  coverage: Coverage;
  article: Article | null;
  stage: ProductionStage;
};

const stages: Array<{ key: ProductionStage; label: string; description: string; color: string; background: string }> = [
  { key: 'planned', label: COVERAGE_STATUS_LABELS.pending, description: 'Evento registrado, pendiente de confirmación.', color: '#665b55', background: '#f1eee9' },
  { key: 'confirmed', label: COVERAGE_STATUS_LABELS.confirmed, description: 'Fecha, lugar y equipo confirmados.', color: '#344e63', background: '#e9eef3' },
  { key: 'completed', label: COVERAGE_STATUS_LABELS.completed, description: 'Cobertura completada; material por organizar.', color: '#36583b', background: '#e7eee7' },
  { key: 'production', label: COVERAGE_STATUS_LABELS.preparing, description: 'Artículo en redacción, edición o preparación.', color: '#76552b', background: '#f3eadb' },
  { key: 'draft', label: EDITORIAL_STATUS_LABELS.draft, description: 'Artículo creado y pendiente de desarrollo editorial.', color: '#76552b', background: '#f3eadb' },
  { key: 'review', label: COVERAGE_STATUS_LABELS.in_review, description: 'Artículo pendiente de control editorial.', color: '#6b3e5a', background: '#eee5eb' },
  { key: 'scheduled', label: EDITORIAL_STATUS_LABELS.scheduled, description: 'Artículo aprobado para una fecha de publicación futura.', color: '#711c32', background: '#f0e6e2' },
  { key: 'published', label: COVERAGE_STATUS_LABELS.published, description: 'Artículo publicado en GLAMORA.', color: '#36583b', background: '#e7eee7' },
  { key: 'attention', label: 'REVISAR DATOS', description: 'El vínculo o el estado necesita una revisión editorial.', color: '#76552b', background: '#f3eadb' },
];

function formatDate(value: string) {
  return formatBoliviaCalendarDate(value, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProductionDeskPage() {
  const router = useRouter();
  const db = supabaseBrowser();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [message, setMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const [{ data: coverages, error: coverageError }, { data: articles, error: articleError }] = await Promise.all([
        db.from('coverage_assignments').select('*').order('event_date', { ascending: true }),
        db.from('articles').select('id,title,slug,cover_image,editorial_status,is_published,published_at'),
      ]);
      if (coverageError || articleError) {
        setItems([]);
        setMessage(`No se pudo cargar el centro de producción: ${coverageError?.message || articleError?.message}`);
        return;
      }
      const articleBySlug = new Map(((articles || []) as Article[]).map((article) => [article.slug, article]));
      const mapped = ((coverages || []) as Coverage[]).map((coverage) => {
        const article = findLinkedArticle(coverage, articleBySlug);
        return { coverage, article, stage: resolveProductionStage(coverage, article) };
      });
      setItems(mapped);
    } catch (error) {
      setItems([]);
      setMessage(error instanceof Error ? `No se pudo cargar el centro de producción: ${error.message}` : 'No se pudo cargar el centro de producción.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user }, error } = await db.auth.getUser();
        if (error) throw error;
        if (!user || user.email?.toLowerCase() !== 'legarage1014@gmail.com') {
          router.replace('/admin/login');
          return;
        }
        if (!active) return;
        setReady(true);
        await load();
      } catch (error) {
        if (active) {
          setAuthError(error instanceof Error ? error.message : 'No se pudo verificar el acceso.');
          setReady(true);
          setLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [db, load, router]);

  const itemsByStage = useMemo(() => {
    const grouped = Object.fromEntries(stages.map((stage) => [stage.key, [] as ProductionItem[]])) as Record<ProductionStage, ProductionItem[]>;
    for (const item of items) grouped[item.stage].push(item);
    return grouped;
  }, [items]);
  const counts = useMemo(() => Object.fromEntries(stages.map((stage) => [stage.key, itemsByStage[stage.key].length])) as Record<ProductionStage, number>, [itemsByStage]);

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

  return (
    <main className="admin-shell admin-production">
      <div className="admin-top">
        <strong className="admin-wordmark">GLAMORA <span>STUDIO</span></strong>
        <div className="admin-top-nav">
          <a className="text-link" href="/admin">← VOLVER AL DASHBOARD</a>
          <a className="text-link" href="/admin/agenda">AGENDA DE COBERTURAS ↗</a>
          <button className="button-primary" onClick={async () => { await db.auth.signOut(); router.replace('/admin/login'); }}>CERRAR SESIÓN</button>
        </div>
      </div>

      <div className="admin-content">
        <div className="eyebrow">GLAMORA EDITORIAL DESK</div>
        <h1 className="admin-page-title">Centro de producción editorial</h1>
        <p>Seguimiento de cada cobertura desde su planificación hasta su publicación.</p>

        {!loading && !message && <section className="admin-panel" style={{ marginBottom: 22 }}>
          <div className="eyebrow">PULSO DE PRODUCCIÓN</div>
          <h2 style={{ font: '27px Georgia', fontWeight: 400, marginTop: 8 }}>Estado de las coberturas</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 10, marginTop: 18 }}>
            {stages.map((stage) => (
              <div key={stage.key} style={{ border: '1px solid #e7ded5', background: '#fbfaf7', padding: 15, minHeight: 90 }}>
                <div style={{ color: '#806e68', fontSize: 9, letterSpacing: '.12em' }}>{stage.label}</div>
                <div style={{ font: '32px Georgia', color: '#211b1d', marginTop: 8 }}>{counts[stage.key]}</div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #e7ded5', marginTop: 16, paddingTop: 12, display: 'flex', justifyContent: 'space-between', color: '#756b68', fontSize: 11 }}>
            <span>TOTAL DE COBERTURAS EN SEGUIMIENTO</span><strong style={{ color: '#211b1d' }}>{items.length}</strong>
          </div>
        </section>}

        {loading ? <section className="admin-panel admin-feedback" role="status">Cargando producción editorial…</section> : message ? (
          <section className="admin-panel admin-state-error" role="alert">
            <h2 style={{ font: '24px Georgia', fontWeight: 400 }}>No se pudo cargar el centro de producción.</h2>
            <p>{message || 'Revisa la conexión y vuelve a intentarlo.'}</p>
            <button type="button" className="button-primary" onClick={load}>INTENTAR DE NUEVO ↻</button>
          </section>
        ) : items.length === 0 ? (
          <section className="admin-panel"><h2 style={{ font: '24px Georgia', fontWeight: 400 }}>Todavía no hay coberturas</h2><p>Registra una cobertura en la agenda para comenzar a seguir su producción.</p><a className="text-link" href="/admin/agenda">ABRIR AGENDA DE COBERTURAS ↗</a></section>
        ) : (
          <section className="admin-panel">
            <div className="eyebrow">PIPELINE EDITORIAL</div>
            <h2 style={{ font: '27px Georgia', fontWeight: 400 }}>Historias en movimiento</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 14, marginTop: 18 }}>
              {stages.map((stage) => {
                const stageItems = itemsByStage[stage.key];
                return (
                <div key={stage.key} className={`admin-stage admin-stage-${stage.key}`} style={{ border: '1px solid #e7ded5', background: '#fbfaf7', minWidth: 0 }}>
                    <div className="admin-stage-header" style={{ padding: '13px 14px', borderBottom: '1px solid #e7ded5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: 10, letterSpacing: '.12em', color: stage.color }}>{stage.label}</strong>
                      <span style={{ font: '20px Georgia' }}>{stageItems.length}</span>
                    </div>
                    <p style={{ padding: '0 14px', color: '#756b68', fontSize: 11, minHeight: 32 }}>{stage.description}</p>
                    <div style={{ display: 'grid', gap: 9, padding: '0 12px 12px' }}>
                      {stageItems.length === 0 ? <small style={{ color: '#a49a93', padding: '8px 2px' }}>Sin coberturas en esta etapa.</small> : stageItems.map(({ coverage, article }) => (
                        <article key={coverage.id} className="admin-production-card" style={{ border: '1px solid #e7ded5', background: '#fff', padding: 12 }}>
                          <div style={{ color: '#9a766e', fontSize: 9, letterSpacing: '.1em' }}>{coverage.category} · {formatDate(coverage.event_date)}</div>
                          <h3 style={{ font: '18px Georgia', fontWeight: 400, margin: '7px 0' }}>{coverage.title}</h3>
                          <p style={{ margin: 0, color: '#756b68', fontSize: 11 }}>{[coverage.event_time?.slice(0, 5), coverage.venue, coverage.city].filter(Boolean).join(' · ')}</p>
                          {(coverage.lead_name || coverage.photographer) && <p style={{ margin: '7px 0 0', color: '#756b68', fontSize: 11 }}>{[coverage.lead_name, coverage.photographer].filter(Boolean).join(' · ')}</p>}
                          <small style={{ display: 'block', marginTop: 7, color: '#756b68', fontSize: 10 }}>Estado operativo: {getCoverageStatusLabel(coverage.status)}</small>
                          {stage.key === 'attention' && (
                            <p role="status" style={{ margin: '7px 0 0', color: '#76552b', fontSize: 11 }}>
                              {coverage.linked_article_slug && !article
                                ? `No se encontró el artículo vinculado (${coverage.linked_article_slug}).`
                                : `Revisa el estado editorial o de cobertura (${getCoverageStatusLabel(coverage.status)}).`}
                            </p>
                          )}
                          {article && (
                            <div className="admin-production-article">
                              {article.cover_image && <img src={article.cover_image} alt={`Portada de ${article.title}`} loading="lazy" />}
                              <p>Artículo vinculado<strong>{article.title}</strong></p>
                            </div>
                          )}
                          <div style={{ marginTop: 11, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <a className="text-link" href={`/admin/agenda?edit=${encodeURIComponent(coverage.id)}`}>ABRIR COBERTURA ↗</a>
                            {article && <a className="text-link" href={`/articulo/${encodeURIComponent(article.slug)}`} target="_blank" rel="noreferrer">VER ARTÍCULO ↗</a>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 18, paddingTop: 14, borderTop: '1px solid #e7ded5' }}>
              <small style={{ color: '#756b68' }}>El avance se calcula desde los estados de las coberturas y los artículos vinculados.</small>
              <button type="button" className="button-primary" onClick={load}>ACTUALIZAR DATOS ↻</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
