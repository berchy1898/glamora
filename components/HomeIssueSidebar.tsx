'use client';

import Image from 'next/image';
import Link from 'next/link';
import { type MagazineIssue } from '@/lib/issues-data';

interface HomeIssueSidebarProps {
  issue: MagazineIssue | null;
}

export function HomeIssueSidebar({ issue }: HomeIssueSidebarProps) {
  if (!issue) return null;

  const issueNum = String(issue.issue_number || 1).padStart(2, '0');

  return (
    <aside className="side-issue-announcement" aria-label="GLAMORA The Issue">
      <div className="side-issue-card">
        {/* Logo lockup: GLAMORA The Issue */}
        <div className="side-issue-brand">
          <span className="brand-name">GLAMORA</span>
          <span className="brand-issue">The Issue</span>
        </div>

        <span className="side-issue-tag">NUESTRA PRIMERA EDICIÓN</span>

        {/* Portada compacta y limpia, sin stickers ni reflejos */}
        <Link
          href={`/ediciones/${issue.slug}`}
          className="side-issue-cover-link"
          title={`Hojear GLAMORA The Issue Nº ${issueNum}`}
        >
          <div className="side-issue-cover-frame">
            {issue.cover_image ? (
              <Image
                src={issue.cover_image}
                alt={`GLAMORA The Issue - ${issue.title}`}
                fill
                unoptimized={issue.cover_image.startsWith('http')}
                sizes="(max-width: 980px) 260px, 280px"
                className="side-issue-cover-img"
              />
            ) : (
              <div className="side-issue-cover-placeholder">
                <span>GLAMORA</span>
                <small>Nº {issueNum}</small>
              </div>
            )}
            <div className="side-issue-spine" aria-hidden="true" />
          </div>
        </Link>

        <div className="side-issue-info">
          <div className="side-issue-kicker">
            <span>VOL. {new Date().getFullYear()}</span>
            <span>·</span>
            <span>Nº {issueNum}</span>
            <span>·</span>
            <span>BOLIVIA</span>
          </div>

          <h3 className="side-issue-headline">
            <Link href={`/ediciones/${issue.slug}`}>{issue.title}</Link>
          </h3>

          <p className="side-issue-copy">
            Nuestra primera edición impresa y digital ya está disponible para hojear.
          </p>

          <Link href={`/ediciones/${issue.slug}`} className="side-issue-cta">
            HOJEAR EDICIÓN <span>↗</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
