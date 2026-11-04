'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { extractEditorialVideo } from '@/lib/editorial-video';
import {
  DEFAULT_ISSUE_DESIGN,
  type IssueDesignConfig,
  type SpreadLayoutStyle,
} from '@/lib/issue-design-types';

type IssueArticleItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: string | null;
  category?: string | null;
  city?: string | null;
  author?: string | null;
  cover_image?: string | null;
  gallery_images?: string[] | null;
  event_name?: string | null;
  venue?: string | null;
  people_tags?: string[] | null;
};

type IssueSponsorItem = {
  id: string;
  brand_name: string;
  tagline?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  image_url?: string | null;
};

type InteractiveIssueReaderProps = {
  issueNumber: number | string;
  issueTitle: string;
  coverImage?: string | null;
  coverStoryId?: string | null;
  articles: IssueArticleItem[];
  sponsors?: IssueSponsorItem[];
  design?: IssueDesignConfig;
  defaultOpen?: boolean;
};

const PALETTE_COLOR: Record<string, string> = {
  champagne: '#e7c7b4',
  ivory: '#fbf7f2',
  obsidian: '#18141c',
  burgundy: '#8f243e',
};

export function InteractiveIssueReader({
  issueNumber,
  issueTitle,
  coverImage,
  coverStoryId,
  articles,
  sponsors = [],
  design = DEFAULT_ISSUE_DESIGN,
  defaultOpen = false,
}: InteractiveIssueReaderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const mergedDesign: IssueDesignConfig = {
    ...DEFAULT_ISSUE_DESIGN,
    ...design,
    articleLayouts: design?.articleLayouts || {},
  };

  // Cada artículo ocupa 2 páginas individuales (izquierda visual + derecha crónica).
  // Total páginas individuales = 2 (portada + carta) + 2 (sumario + sponsor) + (articles.length * 2) + 2 (colofón + contraportada)
  const totalPages = Math.max(6, (articles.length + 3) * 2);
  const totalSpreads = Math.ceil(totalPages / 2);
  const desktopSpreadIndex = Math.floor(activePageIndex / 2);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 860);
    }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  function goToPage(target: number) {
    const clamped = Math.max(0, Math.min(totalPages - 1, target));
    if (clamped === activePageIndex) return;
    setFlipDirection(clamped > activePageIndex ? 'next' : 'prev');
    setActivePageIndex(clamped);
    if (stageRef.current) {
      stageRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    setTimeout(() => setFlipDirection(null), 340);
  }

  function handleNext() {
    if (isMobile) {
      goToPage(activePageIndex + 1);
    } else {
      const currentSpread = Math.floor(activePageIndex / 2);
      goToPage(Math.min(totalPages - 1, (currentSpread + 1) * 2));
    }
  }

  function handlePrev() {
    if (isMobile) {
      goToPage(activePageIndex - 1);
    } else {
      const currentSpread = Math.floor(activePageIndex / 2);
      goToPage(Math.max(0, (currentSpread - 1) * 2));
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    }

    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, activePageIndex, totalPages, isMobile]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchStartY.current = e.touches[0]?.clientY ?? null;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const endY = e.changedTouches[0]?.clientY ?? touchStartY.current;
    const deltaX = touchStartX.current - endX;
    const deltaY = touchStartY.current - endY;

    // Pase horizontal estricto (1 página a la vez en móvil)
    if (Math.abs(deltaX) > 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }

  const featuredSponsor = sponsors[0] || null;
  const formattedIssueNum = String(issueNumber).padStart(2, '0');
  const calloutLines = (mergedDesign.coverCallouts || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);

  function getPageLabel(pageIdx: number): string {
    if (pageIdx === 0) return 'PORTADA';
    if (pageIdx === 1) return 'CARTA EDITORIAL';
    if (pageIdx === 2) return 'SUMARIO';
    if (pageIdx === 3) return 'PATROCINADOR';
    const articleBase = 4;
    const lastArticlePage = articleBase + articles.length * 2;
    if (pageIdx >= articleBase && pageIdx < lastArticlePage) {
      const artIdx = Math.floor((pageIdx - articleBase) / 2);
      const isLeft = (pageIdx - articleBase) % 2 === 0;
      const art = articles[artIdx];
      const name = art?.event_name || art?.title || `HISTORIA ${artIdx + 1}`;
      const shortName = name.length > 20 ? name.slice(0, 18) + '…' : name;
      return isLeft ? `${shortName} · FOTO` : `${shortName} · CRÓNICA`;
    }
    if (pageIdx === totalPages - 2) return 'COLOFÓN';
    if (pageIdx === totalPages - 1) return 'CONTRAPORTADA';
    return `PÁG. ${pageIdx + 1}`;
  }

  function renderPageContent(pageIdx: number, slot: 'left' | 'right' | 'single') {
    // 0 = Portada Art
    if (pageIdx === 0) {
      return (
        <div className={`mag-page mag-page-cover-art ${slot === 'left' ? 'mag-page-left' : ''}`}>
          <div className="mag-cover-full">
            {coverImage ? (
              <img
                src={coverImage}
                alt={`Portada de ${issueTitle}`}
                draggable={false}
              />
            ) : (
              <div className="mag-cover-placeholder">
                <span>GLAMORA</span>
                <strong>{issueTitle}</strong>
              </div>
            )}
            {(mergedDesign.coverHeadline || mergedDesign.coverSubhead) && (
              <div className="issue-cover-art-overlay">
                <div className="issue-cover-bottom-lines">
                  {mergedDesign.coverHeadline && (
                    <strong>{mergedDesign.coverHeadline}</strong>
                  )}
                  {mergedDesign.coverSubhead && (
                    <p>{mergedDesign.coverSubhead}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {slot === 'single' && (
            <footer className="mag-page-folio">
              <span>GLAMORA · THE DIGITAL ISSUE</span>
              <span>Nº {formattedIssueNum}</span>
            </footer>
          )}
        </div>
      );
    }

    // 1 = Carta Editorial
    if (pageIdx === 1) {
      return (
        <div className={`mag-page mag-page-cover-intro ${slot === 'right' ? 'mag-page-right' : ''}`}>
          <div className="mag-page-inner">
            <span className="mag-kicker">
              CARTA EDITORIAL · Nº {formattedIssueNum}
            </span>
            <h2>{mergedDesign.editorLetterTitle || issueTitle}</h2>
            <p>{mergedDesign.editorLetterBody}</p>
            <div className="mag-signature" style={{ marginBottom: 24 }}>
              <strong>
                {mergedDesign.editorSignature || 'DIRECCIÓN EDITORIAL · GLAMORA'}
              </strong>
              <span>COCHABAMBA · BOLIVIA</span>
            </div>
            <button
              type="button"
              className="mag-open-first-btn"
              onClick={() => goToPage(2)}
            >
              PASAR AL SUMARIO →
            </button>
          </div>
          <footer className="mag-page-folio">
            <span>GLAMORA · CARTA DEL DIRECTOR</span>
            <span>PÁG. 01</span>
          </footer>
        </div>
      );
    }

    // 2 = Sumario (TOC)
    if (pageIdx === 2) {
      return (
        <div className={`mag-page ${slot === 'left' ? 'mag-page-left' : ''}`}>
          <div className="mag-page-inner">
            <span className="mag-kicker">
              TABLE OF CONTENTS · Nº {formattedIssueNum}
            </span>
            <h3 className="mag-toc-title">En esta edición</h3>
            <ol className="mag-toc-list">
              {articles.map((art, idx) => {
                const pageNumber = (idx + 1) * 2 + 2;
                const isCover = art.id === coverStoryId || idx === 0;
                return (
                  <li key={art.id}>
                    <button
                      type="button"
                      className="mag-toc-row"
                      onClick={() => goToPage(4 + idx * 2)}
                    >
                      <span className="mag-toc-num">
                        PÁG. {String(pageNumber).padStart(2, '0')}
                      </span>
                      <div className="mag-toc-info">
                        <small>
                          {[
                            isCover ? 'COVER STORY' : null,
                            art.category,
                            art.city,
                          ]
                            .filter(Boolean)
                            .join(' · ')
                            .toUpperCase()}
                        </small>
                        <strong>{art.title}</strong>
                      </div>
                      <span className="mag-toc-go">LEER →</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
          <footer className="mag-page-folio">
            <span>PÁG. 02</span>
            <span>SUMARIO EDITORIAL</span>
          </footer>
        </div>
      );
    }

    // 3 = Patrocinador Oficial o Editorial Letter
    if (pageIdx === 3) {
      return (
        <div className={`mag-page ${slot === 'right' ? 'mag-page-right' : ''}`}>
          <div className="mag-page-inner mag-sponsor-or-letter">
            {featuredSponsor ? (
              <div className="mag-ad-spread">
                <span className="mag-ad-badge">
                  PATROCINADOR OFICIAL · GLAMORA PARTNER
                </span>
                {featuredSponsor.image_url && (
                  <div className="mag-ad-image">
                    <img
                      src={featuredSponsor.image_url}
                      alt={featuredSponsor.brand_name}
                      draggable={false}
                    />
                  </div>
                )}
                <h4>{featuredSponsor.brand_name}</h4>
                {featuredSponsor.tagline && <p>{featuredSponsor.tagline}</p>}
                {featuredSponsor.cta_url && (
                  <a
                    href={featuredSponsor.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mag-ad-cta"
                  >
                    {featuredSponsor.cta_label || 'DESCUBRIR MARCA'} ↗
                  </a>
                )}
              </div>
            ) : (
              <div className="mag-editorial-letter">
                <span className="mag-kicker">THE GLAMORA STANDARD</span>
                <h3>Periodismo visual, moda, cultura y sociedad.</h3>
                <p>
                  Cada historia ha sido diagramada preservando la proporción fotográfica original y el rigor estético de nuestras coberturas de sociedad.
                </p>
              </div>
            )}
          </div>
          <footer className="mag-page-folio">
            <span>{featuredSponsor ? 'PUBLICIDAD EXCLUSIVA' : 'GLAMORA'}</span>
            <span>PÁG. 03</span>
          </footer>
        </div>
      );
    }

    // Páginas de historias (pageIdx 4 .. 4 + articles.length * 2 - 1)
    const articleBase = 4;
    const lastArticlePage = articleBase + articles.length * 2;
    if (pageIdx >= articleBase && pageIdx < lastArticlePage) {
      const artIdx = Math.floor((pageIdx - articleBase) / 2);
      const isLeft = (pageIdx - articleBase) % 2 === 0;
      const currentArticle = articles[artIdx];
      const pageNumFormatted = String(pageIdx).padStart(2, '0');

      const currentLayout: SpreadLayoutStyle =
        mergedDesign.articleLayouts[currentArticle.id] ||
        (Array.isArray(currentArticle.gallery_images) &&
        currentArticle.gallery_images.filter(Boolean).length >= 3
          ? 'vogue-collage'
          : 'vogue-asymmetric');

      // LADO IZQUIERDO: ARTE / FOTOGRAFÍA / COMPOSICIÓN
      if (isLeft) {
        if (currentLayout === 'cinema-bleed') {
          return (
            <div className={`mag-page mag-page-cinema-dark ${slot === 'left' ? 'mag-page-left' : ''}`}>
              <div className="mag-cinema-frame">
                {currentArticle.cover_image && (
                  <img
                    src={currentArticle.cover_image}
                    alt={currentArticle.title}
                    draggable={false}
                  />
                )}
                <div className="mag-cinema-caption">
                  <span>
                    {[currentArticle.category, currentArticle.city]
                      .filter(Boolean)
                      .join(' · ')
                      .toUpperCase()}
                  </span>
                  <h3>{currentArticle.title}</h3>
                </div>
              </div>
              <footer className="mag-page-folio" style={{ color: '#c4b5a9' }}>
                <span>PÁG. {pageNumFormatted}</span>
                <span>CINEMA SPREAD</span>
              </footer>
            </div>
          );
        }

        if (currentLayout === 'vogue-asymmetric') {
          return (
            <div className={`mag-page mag-vogue-asym-left ${slot === 'left' ? 'mag-page-left' : ''}`}>
              <span className="mag-kicker">
                GLAMORA SIGNATURE · {(currentArticle.city || 'BOLIVIA').toUpperCase()}
              </span>
              <div className="mag-vogue-vignette-stack">
                {[
                  currentArticle.gallery_images?.[0] || currentArticle.cover_image,
                  currentArticle.gallery_images?.[1] || currentArticle.cover_image,
                ]
                  .filter(Boolean)
                  .map((imgUrl, vIdx) => {
                    const paragraphs = extractEditorialVideo(currentArticle.body || '')
                      .cleanBody.replace(/\[IMAGEN:[^\]]+\]/gi, '')
                      .split(/\n\s*\n/)
                      .map((p: string) =>
                        p.replace(/^##\s+/, '').replace(/^>\s+/, '').trim()
                      )
                      .filter(Boolean);
                    const snippet =
                      paragraphs[vIdx] ||
                      currentArticle.excerpt ||
                      'Crónica y mirada propia desde nuestras ciudades.';
                    return (
                      <article key={vIdx} className="mag-vogue-vignette-card">
                        <div className="mag-vogue-vignette-photo">
                          <img
                            src={imgUrl as string}
                            alt={`${currentArticle.title} detalle ${vIdx + 1}`}
                            draggable={false}
                          />
                        </div>
                        <div className="mag-vogue-vignette-copy">
                          <strong>
                            {vIdx === 0
                              ? (currentArticle.event_name || currentArticle.category || 'EL ESTILO').toUpperCase()
                              : (currentArticle.venue || currentArticle.author || 'LA ESCENA').toUpperCase()}
                          </strong>
                          <p>{snippet.slice(0, 190)}{snippet.length > 190 ? '…' : ''}</p>
                        </div>
                      </article>
                    );
                  })}
              </div>
              <footer className="mag-page-folio">
                <span>PÁG. {pageNumFormatted}</span>
                <span>GLAMORA · THE EDIT</span>
              </footer>
            </div>
          );
        }

        if (currentLayout === 'vogue-collage') {
          return (
            <div className={`mag-page mag-envogue-page ${slot === 'left' ? 'mag-page-left' : ''}`}>
              <div className="mag-envogue-header">
                <span className="mag-envogue-italic">The</span>
                <strong className="mag-envogue-masthead">GLAMORA</strong>
              </div>
              <div className="mag-envogue-collage-stage">
                <div className="mag-envogue-center-hero">
                  <img
                    src={
                      (currentArticle.cover_image ||
                        currentArticle.gallery_images?.[0]) as string
                    }
                    alt={currentArticle.title}
                    draggable={false}
                  />
                  <span className="mag-envogue-tag">
                    01 · {(currentArticle.category || 'LOOK').toUpperCase()}
                  </span>
                </div>

                <div className="mag-envogue-floating mag-envogue-float-tl">
                  <img
                    src={
                      (currentArticle.gallery_images?.[0] ||
                        currentArticle.cover_image) as string
                    }
                    alt="Detalle 1"
                    draggable={false}
                  />
                  <small>DETALLE EDITORIAL · 02</small>
                </div>

                <div className="mag-envogue-floating mag-envogue-float-br">
                  <img
                    src={
                      (currentArticle.gallery_images?.[1] ||
                        currentArticle.cover_image) as string
                    }
                    alt="Detalle 2"
                    draggable={false}
                  />
                  <small>
                    {(currentArticle.city || 'BOLIVIA').toUpperCase()} · 03
                  </small>
                </div>
              </div>
              <footer className="mag-page-folio">
                <span>PÁG. {pageNumFormatted}</span>
                <span>MOODBOARD · {(currentArticle.event_name || currentArticle.title).toUpperCase().slice(0, 24)}</span>
              </footer>
            </div>
          );
        }

        // Layout por defecto: fotograma visual destacado
        return (
          <div className={`mag-page mag-page-visual ${slot === 'left' ? 'mag-page-left' : ''}`}>
            <div className="mag-visual-frame">
              {currentArticle.cover_image ? (
                <img
                  src={currentArticle.cover_image}
                  alt={currentArticle.title}
                  draggable={false}
                />
              ) : (
                <div className="mag-cover-placeholder">
                  <span>GLAMORA</span>
                </div>
              )}
            </div>
            {Array.isArray(currentArticle.gallery_images) &&
              currentArticle.gallery_images.filter(Boolean).length > 0 && (
                <div className="mag-mini-gallery">
                  {currentArticle.gallery_images
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((imgUrl, gIdx) => (
                      <div key={gIdx} className="mag-mini-thumb">
                        <img
                          src={imgUrl}
                          alt={`${currentArticle.title} ${gIdx + 1}`}
                          draggable={false}
                        />
                      </div>
                    ))}
                </div>
              )}
            <footer className="mag-page-folio">
              <span>PÁG. {pageNumFormatted}</span>
              <span>{(currentArticle.event_name || currentArticle.city || 'GLAMORA').toUpperCase()}</span>
            </footer>
          </div>
        );
      }

      // LADO DERECHO: CRÓNICA Y TITULARES
      return (
        <div className={`mag-page mag-page-story ${slot === 'right' ? 'mag-page-right' : ''}`}>
          <div className="mag-page-inner">
            <span className="mag-kicker">
              {[
                currentArticle.id === coverStoryId ? 'COVER STORY' : null,
                currentArticle.category,
                currentArticle.city,
              ]
                .filter(Boolean)
                .join(' · ')
                .toUpperCase()}
            </span>

            <h3 className="mag-story-headline">{currentArticle.title}</h3>

            {currentArticle.author && (
              <div className="mag-story-byline">
                POR {currentArticle.author.toUpperCase()}
              </div>
            )}

            {currentArticle.excerpt && (
              <p className="mag-pull-quote">&ldquo;{currentArticle.excerpt}&rdquo;</p>
            )}

            <div className="mag-story-columns">
              {extractEditorialVideo(currentArticle.body || '')
                .cleanBody.replace(/\[IMAGEN:[^\]]+\]/gi, '')
                .split(/\n\s*\n/)
                .map((p: string) =>
                  p.replace(/^##\s+/, '').replace(/^>\s+/, '').trim()
                )
                .filter(Boolean)
                .slice(0, 2)
                .map((para: string, pIdx: number) => (
                  <p key={pIdx}>{para}</p>
                ))}
            </div>

            {Array.isArray(currentArticle.people_tags) &&
              currentArticle.people_tags.filter(Boolean).length > 0 && (
                <div className="mag-story-people">
                  <span>PROTAGONISTAS: </span>
                  {currentArticle.people_tags.filter(Boolean).slice(0, 5).join(' · ')}
                </div>
              )}

            <div className="mag-story-cta-wrap">
              <Link
                href={`/articulo/${currentArticle.slug}`}
                className="mag-story-read-link"
                onClick={() => setIsOpen(false)}
              >
                LEER NOTA Y GALERÍA COMPLETA ↗
              </Link>
            </div>
          </div>

          <footer className="mag-page-folio">
            <span>GLAMORA · {issueTitle.toUpperCase()}</span>
            <span>PÁG. {pageNumFormatted}</span>
          </footer>
        </div>
      );
    }

    // Colofón
    if (pageIdx === totalPages - 2) {
      return (
        <div className={`mag-page ${slot === 'left' ? 'mag-page-left' : ''}`}>
          <div className="mag-page-inner mag-colophon">
            <span className="mag-kicker">COLOFÓN EDITORIAL</span>
            <h3>GLAMORA · REVISTA DIGITAL</h3>
            <p>
              Cochabamba · La Paz · Santa Cruz · Oruro · Potosí · The World.
              Todos los derechos reservados. Prohibida su reproducción o descarga parcial o total.
            </p>
            <div className="mag-colophon-links">
              <Link href="/publicidad" onClick={() => setIsOpen(false)}>
                ANUNCIAR EN LA PRÓXIMA EDICIÓN ↗
              </Link>
              <Link href="/ediciones" onClick={() => setIsOpen(false)}>
                VER ARCHIVO DE EDICIONES ↗
              </Link>
            </div>
          </div>
          <footer className="mag-page-folio">
            <span>PROPIEDAD INTELECTUAL RESERVADA</span>
            <span>GLAMORA</span>
          </footer>
        </div>
      );
    }

    // Contraportada final
    return (
      <div className={`mag-page mag-backcover ${slot === 'right' ? 'mag-page-right' : ''}`}>
        <div className="mag-backcover-inner">
          <span className="mag-backcover-monogram">G</span>
          <strong>GLAMORA</strong>
          <small>ESTILO · CULTURA · SOCIEDAD</small>
          <button
            type="button"
            className="mag-open-first-btn mag-backcover-btn"
            onClick={() => goToPage(0)}
          >
            ↺ VOLVER A LA PORTADA
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* PORTADA INTERACTIVA CLICABLE */}
      <div
        className="issue-cover issue-cover-interactive"
        role="button"
        tabIndex={0}
        aria-label={`Tocar portada para hojear la edición ${issueTitle}`}
        onClick={() => {
          setActivePageIndex(0);
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActivePageIndex(0);
            setIsOpen(true);
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="issue-cover-book-frame">
          <div className="issue-cover-photo-stage">
            {coverImage ? (
              <img
                src={coverImage}
                alt={`Portada de ${issueTitle} - GLAMORA`}
                draggable={false}
              />
            ) : (
              <div className="mag-cover-placeholder">
                <span>GLAMORA</span>
                <strong>{issueTitle}</strong>
              </div>
            )}

            {(mergedDesign.coverHeadline ||
              mergedDesign.coverSubhead ||
              calloutLines.length > 0) && (
              <div className="issue-cover-art-overlay">
                {calloutLines.length > 0 && (
                  <div className="issue-cover-side-callouts">
                    {calloutLines.map((line, idx) => (
                      <span key={idx}>{line}</span>
                    ))}
                  </div>
                )}

                {(mergedDesign.coverHeadline || mergedDesign.coverSubhead) && (
                  <div className="issue-cover-bottom-lines">
                    {mergedDesign.coverHeadline && (
                      <strong>{mergedDesign.coverHeadline}</strong>
                    )}
                    {mergedDesign.coverSubhead && (
                      <p>{mergedDesign.coverSubhead}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div
          className="mag-reader-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Edición interactiva Nº ${formattedIssueNum} · ${issueTitle}`}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Barra superior minimalista */}
          <header className="mag-reader-topbar">
            <div className="mag-reader-brand">
              <span>GLAMORA · THE DIGITAL ISSUE · Nº {formattedIssueNum}</span>
              <strong>{issueTitle}</strong>
            </div>

            <div className="mag-reader-top-actions">
              <button
                type="button"
                className="mag-reader-top-btn"
                onClick={() => goToPage(0)}
              >
                PORTADA
              </button>
              <button
                type="button"
                className="mag-reader-top-btn"
                onClick={() => goToPage(2)}
              >
                SUMARIO
              </button>
              <button
                type="button"
                className="mag-reader-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar revista"
              >
                CERRAR ✕
              </button>
            </div>
          </header>

          {/* Escenario central */}
          <div className="mag-reader-stage" ref={stageRef}>
            <button
              type="button"
              className="mag-reader-side-arrow mag-reader-side-prev"
              disabled={activePageIndex === 0}
              onClick={handlePrev}
              aria-label="Página anterior"
            >
              ‹
            </button>

            {isMobile ? (
              /* VISTA MÓVIL: EXACTAMENTE UNA PÁGINA INDIVIDUAL POR DESLIZADA / SWIPE */
              <div
                className={`mag-mobile-single-page mag-protected-content ${
                  flipDirection === 'next'
                    ? 'mag-flip-next'
                    : flipDirection === 'prev'
                      ? 'mag-flip-prev'
                      : ''
                }`}
              >
                {renderPageContent(activePageIndex, 'single')}
              </div>
            ) : (
              /* VISTA COMPUTADORA: PLIEGO DE DOBLE PÁGINA ENFRENTADA */
              <div
                className={`mag-spread-book mag-protected-content ${
                  flipDirection === 'next'
                    ? 'mag-flip-next'
                    : flipDirection === 'prev'
                      ? 'mag-flip-prev'
                      : ''
                }`}
              >
                <div className="mag-spine-shadow" aria-hidden="true" />
                {renderPageContent(desktopSpreadIndex * 2, 'left')}
                {renderPageContent(desktopSpreadIndex * 2 + 1, 'right')}
              </div>
            )}

            <button
              type="button"
              className="mag-reader-side-arrow mag-reader-side-next"
              disabled={activePageIndex >= totalPages - 1}
              onClick={handleNext}
              aria-label="Página siguiente"
            >
              ›
            </button>
          </div>

          {/* Barra inferior */}
          <footer className="mag-reader-bottombar">
            <button
              type="button"
              className="mag-bottom-nav-btn"
              disabled={activePageIndex === 0}
              onClick={handlePrev}
            >
              ‹ ANTERIOR
            </button>

            {isMobile ? (
              <div className="mag-mobile-page-counter" aria-live="polite">
                <span className="mag-mobile-page-num">
                  PÁG. {activePageIndex + 1} DE {totalPages}
                </span>
                <span className="mag-mobile-page-title">
                  {getPageLabel(activePageIndex)}
                </span>
              </div>
            ) : (
              <div className="mag-spread-dots">
                {Array.from({ length: totalSpreads }).map((_, idx) => {
                  const label =
                    idx === 0
                      ? 'PORTADA'
                      : idx === 1
                        ? 'SUMARIO'
                        : idx === totalSpreads - 1
                          ? 'CIERRE'
                          : `PÁG ${(idx - 1) * 2 + 2}-${(idx - 1) * 2 + 3}`;
                  const isActive = desktopSpreadIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`mag-spread-pill${isActive ? ' active' : ''}`}
                      onClick={() => goToPage(idx * 2)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              className="mag-bottom-nav-btn"
              disabled={activePageIndex >= totalPages - 1}
              onClick={handleNext}
            >
              SIGUIENTE ›
            </button>
          </footer>
        </div>
      )}
    </>
  );
}
