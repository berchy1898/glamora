'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type MagazineIssue } from '@/lib/issues-data';

interface HomeIssueKioskProps {
  issue: MagazineIssue | null;
}

export function HomeIssueKiosk({ issue }: HomeIssueKioskProps) {
  if (!issue) return null;

  const issueNum = String(issue.issue_number || 1).padStart(2, '0');
  const formattedDate = issue.published_at
    ? new Intl.DateTimeFormat('es-BO', {
        month: 'long',
        year: 'numeric',
      }).format(new Date(issue.published_at))
    : 'NOVIEMBRE DE 2026';

  return (
    <section className="mag-vogue-section" aria-label="GLAMORA The Issue">
      <div className="container mag-vogue-inner">
        {/* Header - Inspired directly by Vogue & Vanity Fair */}
        <header className="mag-vogue-header">
          <span className="mag-vogue-overline">
            VISTA PREVIA INTERACTIVA (HAZ CLIC EN LA PORTADA PARA HOJEAR)
          </span>
          <h2 className="mag-vogue-title">
            <span className="mag-vogue-title-brand">GLAMORA</span>{' '}
            <span className="mag-vogue-title-issue">The Issue</span>
          </h2>
        </header>

        <div className="mag-vogue-grid">
          {/* Cover Presentation: Clean, majestic editorial portrait without stickers or glare */}
          <div className="mag-vogue-cover-col">
            <Link
              href={`/ediciones/${issue.slug}`}
              className="mag-vogue-cover-link"
              title={`Hojear GLAMORA The Issue Nº ${issueNum}`}
            >
              <div className="mag-vogue-cover-frame">
                {issue.cover_image ? (
                  <Image
                    src={issue.cover_image}
                    alt={`Portada GLAMORA The Issue Nº ${issueNum} - ${issue.title}`}
                    fill
                    unoptimized={issue.cover_image.startsWith('http')}
                    sizes="(max-width: 768px) 90vw, 420px"
                    className="mag-vogue-cover-img"
                    priority
                  />
                ) : (
                  <div className="mag-vogue-cover-placeholder">
                    <span className="ph-brand">GLAMORA</span>
                    <span className="ph-num">Nº {issueNum}</span>
                    <p className="ph-title">{issue.title}</p>
                  </div>
                )}
                {/* Subtle natural paper book spine shadow */}
                <div className="mag-vogue-spine-shadow" aria-hidden="true" />
              </div>
            </Link>
            <span className="mag-vogue-click-cue">✦ Haz clic en la portada para abrir</span>
          </div>

          {/* Editorial Content: Pure haute couture refinement, no robotic jargon */}
          <div className="mag-vogue-copy-col">
            <div className="mag-vogue-meta">
              <span>VOLUMEN {new Date().getFullYear()}</span>
              <span className="sep">·</span>
              <span style={{ textTransform: 'uppercase' }}>{formattedDate}</span>
              <span className="sep">·</span>
              <span>BOLIVIA</span>
            </div>

            <h3 className="mag-vogue-headline">{issue.title}</h3>

            <p className="mag-vogue-desc">
              {issue.description ||
                'Una cuidada composición de crónicas de moda, veladas de gala, perfiles y gastronomía de autor curada por el equipo de GLAMORA.'}
            </p>

            {/* Editorial Columns / Sections (Vogue Contents style) */}
            <div className="mag-vogue-contents">
              <span className="mag-vogue-contents-label">EN ESTE NÚMERO</span>
              <div className="mag-vogue-contents-tags">
                <span className="tag-item">Moda &amp; Atelier</span>
                <span className="tag-sep">/</span>
                <span className="tag-item">Sociedad &amp; Galas</span>
                <span className="tag-sep">/</span>
                <span className="tag-item">Diálogos</span>
                <span className="tag-sep">/</span>
                <span className="tag-item">Gourmet &amp; Estilo</span>
              </div>
            </div>

            {/* Haute Couture Actions */}
            <div className="mag-vogue-actions">
              <Link
                href={`/ediciones/${issue.slug}`}
                className="mag-vogue-cta-primary"
              >
                <span>HOJEAR EDICIÓN DIGITAL Nº {issueNum}</span>
                <span className="arrow">↗</span>
              </Link>
              <Link href="/ediciones" className="mag-vogue-cta-secondary">
                <span>VER ARCHIVO DE EDICIONES</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Export alias for compatibility
export { HomeIssueKiosk as HomeIssueShowcase };
