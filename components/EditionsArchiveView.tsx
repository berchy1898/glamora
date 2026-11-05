'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type MagazineIssue } from '@/lib/issues-data';

interface EditionsArchiveViewProps {
  issues: MagazineIssue[];
}

export function EditionsArchiveView({ issues }: EditionsArchiveViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | '2026' | 'special'>('all');
  const [viewMode, setViewMode] = useState<'catalog' | 'bookshelf'>('catalog');
  const [hoveredSpine, setHoveredSpine] = useState<MagazineIssue | null>(null);

  const filteredIssues = issues.filter((issue) => {
    if (activeFilter === '2026') {
      const year = issue.published_at ? new Date(issue.published_at).getFullYear() : 2026;
      return year === 2026;
    }
    if (activeFilter === 'special') {
      return (issue.title?.toLowerCase().includes('especial') || issue.issue_number === 1);
    }
    return true;
  });

  const [featured, ...rest] = filteredIssues;

  const formatDate = (val?: string | null) => {
    if (!val) return '2026';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '2026';
    return new Intl.DateTimeFormat('es-BO', { month: 'long', year: 'numeric' }).format(d);
  };

  return (
    <div className="editions-archive-container">
      {/* Hemeroteca Control Bar */}
      <div className="editions-controls-bar">
        <div className="editions-filter-pills" role="tablist" aria-label="Filtrar ediciones">
          <button
            type="button"
            className={`editions-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            TODOS LOS VOLÚMENES ({issues.length})
          </button>
          <button
            type="button"
            className={`editions-filter-btn ${activeFilter === '2026' ? 'active' : ''}`}
            onClick={() => setActiveFilter('2026')}
          >
            AÑO 2026
          </button>
          <button
            type="button"
            className={`editions-filter-btn ${activeFilter === 'special' ? 'active' : ''}`}
            onClick={() => setActiveFilter('special')}
          >
            EDICIONES DE COLECCIÓN
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="editions-view-toggle">
          <button
            type="button"
            className={`editions-toggle-btn ${viewMode === 'catalog' ? 'active' : ''}`}
            onClick={() => setViewMode('catalog')}
            title="Vista de catálogo editorial"
          >
            <span>⊞ CATÁLOGO</span>
          </button>
          <button
            type="button"
            className={`editions-toggle-btn ${viewMode === 'bookshelf' ? 'active' : ''}`}
            onClick={() => setViewMode('bookshelf')}
            title="Vista de estantería de coleccionista"
          >
            <span>❚❚❚ ESTANTERÍA</span>
          </button>
        </div>
      </div>

      {filteredIssues.length === 0 ? (
        <div className="editorial-note">
          <span>GLAMORA · HEMEROTECA</span>
          <p>No se encontraron ediciones con el filtro seleccionado.</p>
        </div>
      ) : viewMode === 'bookshelf' ? (
        /* Bookshelf / Spines 3D Mode */
        <div className="editions-bookshelf-zone">
          <div className="editions-bookshelf-heading">
            <span className="bookshelf-gold-label">ESTANTERÍA DE AUTOR · BIBLIOTECA GLAMORA</span>
            <small>Pasa el cursor sobre el lomo para previsualizar la portada y abrir el lector digital</small>
          </div>

          <div className="editions-shelf-rack">
            <div className="editions-spines-row">
              {filteredIssues.map((issue) => {
                const num = String(issue.issue_number).padStart(2, '0');
                const isHovered = hoveredSpine?.id === issue.id;

                return (
                  <div
                    key={issue.id}
                    className={`editions-spine-unit ${isHovered ? 'active' : ''}`}
                    onMouseEnter={() => setHoveredSpine(issue)}
                    onMouseLeave={() => setHoveredSpine(null)}
                  >
                    <Link
                      href={`/ediciones/${issue.slug}`}
                      className="editions-spine-card"
                      title={`Abrir Edición Nº ${num}`}
                    >
                      <div className="spine-foil-band" />
                      <div className="spine-number">Nº {num}</div>
                      <div className="spine-title-vertical">
                        <span>{issue.title}</span>
                      </div>
                      <div className="spine-brand">GLAMORA</div>
                    </Link>

                    {/* Popover preview on hover */}
                    {isHovered && (
                      <div className="editions-spine-popover">
                        <div className="spine-popover-cover">
                          {issue.cover_image ? (
                            <Image
                              src={issue.cover_image}
                              alt={issue.title}
                              fill
                              unoptimized={issue.cover_image.startsWith('http')}
                              sizes="180px"
                              className="spine-popover-img"
                            />
                          ) : (
                            <div className="spine-popover-placeholder">GLAMORA Nº {num}</div>
                          )}
                        </div>
                        <div className="spine-popover-info">
                          <span className="popover-meta">EDICIÓN Nº {num} · {formatDate(issue.published_at)}</span>
                          <strong>{issue.title}</strong>
                          <span className="popover-cta">ABRIR LECTOR DIGITAL ↗</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Shelf Wood / Brass Plank */}
            <div className="editions-shelf-plank">
              <div className="shelf-plank-gold-inlay" />
            </div>
          </div>
        </div>
      ) : (
        /* Catalog Mode */
        <div className="editions-catalog-zone">
          {featured && (
            <section className="editions-monograph-card" aria-label="Edición Destacada">
              <div className="monograph-cover-wrap">
                <Link href={`/ediciones/${featured.slug}`} className="monograph-cover-link">
                  {featured.cover_image ? (
                    <Image
                      src={featured.cover_image}
                      alt={featured.title}
                      fill
                      priority
                      unoptimized={featured.cover_image.startsWith('http')}
                      sizes="(max-width: 900px) 100vw, 420px"
                      className="monograph-cover-img"
                    />
                  ) : (
                    <div className="monograph-placeholder">
                      <span>GLAMORA</span>
                      <strong>Nº {String(featured.issue_number).padStart(2, '0')}</strong>
                    </div>
                  )}
                  <div className="monograph-seal">
                    <span>EDICIÓN ACTUAL</span>
                    <strong>Nº {String(featured.issue_number).padStart(2, '0')}</strong>
                  </div>
                </Link>
              </div>

              <div className="monograph-body">
                <div className="monograph-eyebrow">
                  <span>VOLUMEN {new Date().getFullYear()}</span>
                  <span>·</span>
                  <span style={{ textTransform: 'uppercase' }}>{formatDate(featured.published_at)}</span>
                  <span>·</span>
                  <span>THE DIGITAL ISSUE</span>
                </div>

                <h2 className="monograph-title">
                  <Link href={`/ediciones/${featured.slug}`}>{featured.title}</Link>
                </h2>

                <p className="monograph-desc">
                  {featured.description ||
                    'Una selección especial de perfiles, estilo, cultura y crónicas contemporáneas reunidas bajo la mirada editorial de GLAMORA.'}
                </p>

                <div className="monograph-highlights">
                  <div className="monograph-feature-item">
                    <span className="mono-dot">✦</span>
                    <div>
                      <strong>Fascículos Temáticos</strong>
                      <small>Moda & Atelier · Sociedad & Galas · Diálogos · Gourmet</small>
                    </div>
                  </div>
                  <div className="monograph-feature-item">
                    <span className="mono-dot">✦</span>
                    <div>
                      <strong>Experiencia de Doble Página</strong>
                      <small>Lector interactivo con lupa macro, sonido de papel y modo zen</small>
                    </div>
                  </div>
                </div>

                <div className="monograph-actions">
                  <Link href={`/ediciones/${featured.slug}`} className="monograph-primary-btn">
                    <span>HOJEAR EDICIÓN COMPLETA</span>
                    <span className="monograph-arrow">↗</span>
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Previous Issues Grid */}
          {rest.length > 0 && (
            <div className="editions-archive-shelf-section">
              <div className="section-heading">
                <div>
                  <span className="section-overline">COLECCIÓN · EDICIONES ANTERIORES</span>
                  <h2>Hemeroteca de Colección</h2>
                </div>
                <span className="people-story-count">
                  {rest.length} {rest.length === 1 ? 'EDICIÓN' : 'EDICIONES'}
                </span>
              </div>

              <div className="editions-archive-cards-grid">
                {rest.map((issue) => {
                  const num = String(issue.issue_number).padStart(2, '0');
                  return (
                    <article key={issue.id} className="editions-grid-card">
                      <Link href={`/ediciones/${issue.slug}`} className="grid-card-cover-wrap">
                        {issue.cover_image ? (
                          <Image
                            src={issue.cover_image}
                            alt={issue.title}
                            fill
                            unoptimized={issue.cover_image.startsWith('http')}
                            sizes="(max-width: 768px) 100vw, 320px"
                            className="grid-card-img"
                          />
                        ) : (
                          <div className="grid-card-placeholder">Nº {num}</div>
                        )}
                        <span className="grid-card-tag">Nº {num}</span>
                      </Link>

                      <div className="grid-card-info">
                        <div className="grid-card-date">
                          {formatDate(issue.published_at)} · BOLIVIA
                        </div>
                        <h3 className="grid-card-title">
                          <Link href={`/ediciones/${issue.slug}`}>{issue.title}</Link>
                        </h3>
                        {issue.description && (
                          <p className="grid-card-desc">{issue.description}</p>
                        )}
                        <Link href={`/ediciones/${issue.slug}`} className="grid-card-read-link">
                          ABRIR LECTOR DIGITAL ↗
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
