'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Luxury3DFlipbook } from './Luxury3DFlipbook';
import { InteractiveIssueReader } from './InteractiveIssueReader';
import type { IssueDesignConfig } from '@/lib/issue-design-types';
import type { IssueArticleItem } from '@/lib/issue-pagination';

interface IssueReaderHostProps {
  issueNumber: number | string;
  issueTitle: string;
  coverImage?: string | null;
  coverStoryId?: string | null;
  articles: IssueArticleItem[];
  sponsors?: any[];
  design: IssueDesignConfig;
  pdfUrl?: string | null;
  defaultMode?: 'flipbook' | 'classic';
}

export function IssueReaderHost({
  issueNumber,
  issueTitle,
  coverImage,
  coverStoryId,
  articles,
  sponsors = [],
  design,
  pdfUrl,
  defaultMode = 'flipbook',
}: IssueReaderHostProps) {
  const [activeMode, setActiveMode] = useState<'flipbook' | 'classic'>(
    pdfUrl || design.readerEngine === '3d-flipbook' ? 'flipbook' : defaultMode
  );
  const [isFlipbookOpen, setIsFlipbookOpen] = useState(false);

  const num = String(issueNumber).padStart(2, '0');
  const storyCovers = articles.map((a) => a.cover_image).filter(Boolean) as string[];

  return (
    <div className="issue-reader-host">
      {/* Editorial Mode Selector */}
      <div className="issue-mode-bar">
        <div className="mode-indicator">
          <span>GLAMORA THE ISSUE</span>
          <span className="sep">·</span>
          <span>EDICIÓN Nº {num}</span>
        </div>

        <div className="mode-toggle-group">
          <button
            type="button"
            className={`mode-btn ${activeMode === 'flipbook' ? 'active' : ''}`}
            onClick={() => {
              setActiveMode('flipbook');
              setIsFlipbookOpen(true);
            }}
          >
            <span>📖 LECTOR FLIPBOOK 3D</span>
          </button>
          <button
            type="button"
            className={`mode-btn ${activeMode === 'classic' ? 'active' : ''}`}
            onClick={() => setActiveMode('classic')}
          >
            <span>📄 VISTA DE ARTÍCULOS</span>
          </button>
        </div>
      </div>

      {/* Prominent Haute Couture Showcase Banner to launch Flipbook */}
      <div className="issue-host-hero">
        <div className="host-hero-cover-col">
          <button
            type="button"
            className="host-cover-trigger-btn"
            onClick={() => setIsFlipbookOpen(true)}
            title="Abrir Lector Flipbook 3D"
          >
            <div className="host-cover-frame">
              {coverImage ? (
                <Image
                  src={coverImage}
                  alt={`Portada ${issueTitle}`}
                  fill
                  unoptimized={coverImage.startsWith('http')}
                  sizes="(max-width: 768px) 100vw, 360px"
                  className="host-cover-img"
                  priority
                />
              ) : (
                <div className="host-cover-placeholder">
                  <span>GLAMORA</span>
                  <small>Nº {num}</small>
                </div>
              )}
              <div className="host-cover-spine" aria-hidden="true" />
            </div>
            <span className="host-click-hint">✦ Haz clic para abrir la revista 3D</span>
          </button>
        </div>

        <div className="host-hero-copy-col">
          <div className="host-kicker">
            <span>VOLUMEN {new Date().getFullYear()}</span>
            <span>·</span>
            <span>EDICIÓN Nº {num}</span>
            <span>·</span>
            <span>BOLIVIA</span>
          </div>

          <h2 className="host-headline">{issueTitle}</h2>

          <p className="host-lead">
            {design.editorLetterBody?.slice(0, 240) ||
              'Una edición de colección concebida con los más altos estándares de la moda internacional, crónica social y alta gastronomía.'}
          </p>

          <div className="host-features-list">
            <div className="feature-line">
              <span className="dot">✦</span>
              <span>Lector Flipbook 3D con doble pliego para PC y acústica analógica de papel</span>
            </div>
            <div className="feature-line">
              <span className="dot">✦</span>
              <span>Lupa Macro HD para apreciar texturas, bordados y fotografía editorial</span>
            </div>
          </div>

          <div className="host-actions">
            <button
              type="button"
              className="host-open-flipbook-btn"
              onClick={() => setIsFlipbookOpen(true)}
            >
              <span>ABRIR LECTOR FLIPBOOK 3D</span>
              <span className="arrow">↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full-screen / Modal 3D Flipbook */}
      {isFlipbookOpen && (
        <Luxury3DFlipbook
          pdfUrl={pdfUrl || design.pdfUrl}
          pageImages={[coverImage || '', ...storyCovers].filter(Boolean)}
          issueTitle={issueTitle}
          issueNumber={issueNumber}
          coverImage={coverImage}
          onClose={() => setIsFlipbookOpen(false)}
          defaultOpen={true}
        />
      )}

      {/* Classic HTML Reader (Available if toggled) */}
      {activeMode === 'classic' && (
        <div className="host-classic-reader-zone">
          <InteractiveIssueReader
            issueNumber={issueNumber}
            issueTitle={issueTitle}
            coverImage={coverImage}
            coverStoryId={coverStoryId}
            articles={articles}
            sponsors={sponsors}
            design={design}
          />
        </div>
      )}
    </div>
  );
}
