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
    : 'EDICIÓN ACTUAL';

  const fascicles = [
    {
      label: 'MODA & ATELIER',
      desc: 'Sastrería botánica, lino & alta costura',
      badge: 'FAS. 01',
    },
    {
      label: 'SOCIEDAD & GALAS',
      desc: 'Noches exclusivas, veladas de autor y Who’s Who',
      badge: 'FAS. 02',
    },
    {
      label: 'DIÁLOGOS & VOCES',
      desc: 'Perfiles profundos con creadores e innovadores',
      badge: 'FAS. 03',
    },
    {
      label: 'GOURMET & LIFESTYLE',
      desc: 'Coctelería de autor, maridajes y templos del buen vivir',
      badge: 'FAS. 04',
    },
  ];

  return (
    <section className="mag-kiosk-section" aria-label="Escaparate The Issues">
      <div className="container mag-kiosk-inner">
        <div className="mag-kiosk-header">
          <div className="mag-kiosk-eyebrow">
            <span className="mag-kiosk-pill">THE DIGITAL ISSUE</span>
            <span className="mag-kiosk-sep">✦</span>
            <span>REVISTA EDITORIAL DE COLECCIÓN</span>
          </div>
          <h2 className="mag-kiosk-heading">THE ISSUES · LA REVISTA</h2>
          <p className="mag-kiosk-subheading">
            Una experiencia editorial de alta gama. Formato digital de doble página con tipografía Didone,
            fasículos temáticos y crónicas de autor.
          </p>
        </div>

        <div className="mag-kiosk-stage">
          {/* 3D Magazine Cover Showcase */}
          <div className="mag-kiosk-book-col">
            <Link
              href={`/ediciones/${issue.slug}`}
              className="mag-kiosk-book-link"
              title={`Abrir edición digital Nº ${issueNum}`}
            >
              <div className="mag-kiosk-book-wrap">
                {/* Book 3D spine shadow */}
                <div className="mag-kiosk-spine-rib" aria-hidden="true" />
                
                {/* Book Cover */}
                <div className="mag-kiosk-cover-face">
                  {issue.cover_image ? (
                    <Image
                      src={issue.cover_image}
                      alt={`Portada The Issues Nº ${issueNum} - ${issue.title}`}
                      fill
                      unoptimized={issue.cover_image.startsWith('http')}
                      sizes="(max-width: 768px) 90vw, 380px"
                      className="mag-kiosk-cover-img"
                    />
                  ) : (
                    <div className="mag-kiosk-cover-placeholder">
                      <span className="mag-kiosk-ph-brand">GLAMORA</span>
                      <span className="mag-kiosk-ph-num">Nº {issueNum}</span>
                      <span className="mag-kiosk-ph-theme">{issue.title}</span>
                    </div>
                  )}

                  {/* High gloss reflection overlay */}
                  <div className="mag-kiosk-glare" aria-hidden="true" />

                  {/* Gold seal */}
                  <div className="mag-kiosk-seal">
                    <span>EDICIÓN</span>
                    <strong>Nº {issueNum}</strong>
                    <small>DIGITAL</small>
                  </div>
                </div>

                {/* Right page depth stack */}
                <div className="mag-kiosk-page-stack" aria-hidden="true" />
              </div>
            </Link>

            <div className="mag-kiosk-cover-hint">
              <span>✦ Haz clic para abrir el Lector Digital</span>
            </div>
          </div>

          {/* Editorial Details & Fascicles Column */}
          <div className="mag-kiosk-info-col">
            <div className="mag-kiosk-meta-badge">
              <span>VOLUMEN {new Date().getFullYear()}</span>
              <span>·</span>
              <span style={{ textTransform: 'uppercase' }}>{formattedDate}</span>
              <span>·</span>
              <span>BOLIVIA</span>
            </div>

            <h3 className="mag-kiosk-issue-title">{issue.title}</h3>

            <p className="mag-kiosk-issue-desc">
              {issue.description ||
                'Una cuidada composición de crónicas de moda, veladas de gala, perfiles y gastronomía de autor curada por el equipo de GLAMORA.'}
            </p>

            {/* 4 Fascicles Preview */}
            <div className="mag-kiosk-fascicles-box">
              <span className="mag-kiosk-fascicles-label">FASCÍCULOS DE ESTA EDICIÓN:</span>
              <div className="mag-kiosk-fascicles-grid">
                {fascicles.map((f) => (
                  <div key={f.label} className="mag-kiosk-fas-item">
                    <span className="mag-kiosk-fas-badge">{f.badge}</span>
                    <div className="mag-kiosk-fas-text">
                      <strong>{f.label}</strong>
                      <small>{f.desc}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="mag-kiosk-actions">
              <Link
                href={`/ediciones/${issue.slug}`}
                className="mag-kiosk-cta-primary"
              >
                <span>HOJEAR EDICIÓN DIGITAL Nº {issueNum}</span>
                <span className="mag-kiosk-cta-arrow">↗</span>
              </Link>
              <Link href="/ediciones" className="mag-kiosk-cta-secondary">
                <span>VER ARCHIVO Y HEMEROTECA</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
