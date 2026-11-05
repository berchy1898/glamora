'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_ISSUE_DESIGN,
  type IssueDesignConfig,
  type SpreadLayoutStyle,
} from '@/lib/issue-design-types';
import {
  buildIssuePaginationPlan,
  getCleanImageUrl,
  getPhotoCaption,
  type IssueArticleItem,
  type EditorialBlock,
  type IssuePaginationPlan,
} from '@/lib/issue-pagination';
import {
  computePhotoFilterCss,
  computeVignetteStyle,
  computeGrainStyle,
  type PhotoAdjustments,
} from '@/lib/photo-adjustments';

export type { IssueArticleItem };

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
  allowPrintGuides?: boolean;
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
  allowPrintGuides = false,
}: InteractiveIssueReaderProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [showPrintGuides, setShowPrintGuides] = useState(false);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const mergedDesign: IssueDesignConfig = useMemo(() => {
    return {
      ...DEFAULT_ISSUE_DESIGN,
      ...design,
      articleLayouts: design?.articleLayouts || {},
      articleFilters: design?.articleFilters || {},
      articleFocalPoints: design?.articleFocalPoints || {},
      articleCoverOverrides: design?.articleCoverOverrides || {},
      articlePhotoAdjustments: design?.articlePhotoAdjustments || {},
    };
  }, [design]);

  // Motor de paginación flexible: calcula pliegos dinámicos según extensión del contenido
  const paginationPlan: IssuePaginationPlan = useMemo(() => {
    return buildIssuePaginationPlan(articles, mergedDesign);
  }, [articles, mergedDesign]);

  const totalPages = paginationPlan.totalPages;
  const totalSpreads = paginationPlan.totalSpreads;
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

  // Integración con sumario externo y enlaces hash (#historia-[slug] o #pagina-[num])
  useEffect(() => {
    function handleHash() {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash;
      if (!hash) return;

      if (hash.startsWith('#historia-')) {
        const slug = hash.replace('#historia-', '').trim();
        const mapped = paginationPlan.articlePageMap[slug];
        if (mapped) {
          goToPage(mapped.startPage);
          setIsOpen(true);
        }
      } else if (hash.startsWith('#pagina-')) {
        const pageNum = parseInt(hash.replace('#pagina-', ''), 10);
        if (!isNaN(pageNum) && pageNum >= 0 && pageNum < totalPages) {
          goToPage(pageNum);
          setIsOpen(true);
        }
      }
    }

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [paginationPlan, totalPages]);

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
    const slotDef = paginationPlan.pages[pageIdx];
    if (!slotDef) return `PÁG. ${pageIdx + 1}`;
    if (slotDef.type === 'cover') return 'PORTADA';
    if (slotDef.type === 'letter') return 'CARTA EDITORIAL';
    if (slotDef.type === 'toc') return 'SUMARIO';
    if (slotDef.type === 'sponsor') return 'PATROCINADOR';
    if (slotDef.type === 'colophon') return 'COLOFÓN';
    if (slotDef.type === 'backcover') return 'CONTRAPORTADA';
    if (slotDef.type === 'article-page') {
      const art = slotDef.article;
      const name = art.event_name || art.title || 'HISTORIA';
      const shortName = name.length > 20 ? name.slice(0, 18) + '…' : name;
      const isLeft = slotDef.slot === 'left';
      return isLeft
        ? `${shortName} · PÁG. ${String(pageIdx).padStart(2, '0')}`
        : `${shortName} · CRÓNICA`;
    }
    return `PÁG. ${pageIdx + 1}`;
  }

  function renderPageContent(pageIdx: number, slot: 'left' | 'right' | 'single') {
    const slotDef = paginationPlan.pages[pageIdx];
    const pageNumFormatted = String(pageIdx).padStart(2, '0');
    const slotClass = slot === 'left' ? 'mag-page-left' : slot === 'right' ? 'mag-page-right' : 'mag-page-single';

    // 0 = Portada Art
    if (pageIdx === 0 || slotDef?.type === 'cover') {
      return (
        <div className={`mag-page mag-page-cover-art ${slotClass}`}>
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
    if (pageIdx === 1 || slotDef?.type === 'letter') {
      return (
        <div className={`mag-page mag-page-cover-intro ${slotClass}`}>
          <div className="mag-page-inner">
            <span className="mag-kicker">
              CARTA EDITORIAL · Nº {formattedIssueNum}
            </span>
            <h2>{mergedDesign.editorLetterTitle || issueTitle}</h2>
            <p>{mergedDesign.editorLetterBody}</p>

            <div className="mag-editor-signature">
              <span>{mergedDesign.editorSignature || 'DIRECCIÓN EDITORIAL'}</span>
              <small>GLAMORA BOLIVIA</small>
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

    // 2 = Sumario (TOC) Dinámico
    if (pageIdx === 2 || slotDef?.type === 'toc') {
      return (
        <div className={`mag-page ${slotClass}`}>
          <div className="mag-page-inner">
            <span className="mag-kicker">
              TABLE OF CONTENTS · Nº {formattedIssueNum}
            </span>
            <h3 className="mag-toc-title">En esta edición</h3>
            <ol className="mag-toc-list">
              {paginationPlan.articlePlans.map((plan) => {
                const art = plan.article;
                const isCover = art.id === coverStoryId || plan.startPage === 4;
                return (
                  <li key={art.id}>
                    <button
                      type="button"
                      className="mag-toc-row"
                      onClick={() => goToPage(plan.startPage)}
                    >
                      <span className="mag-toc-num">
                        {plan.pageRangeLabel}
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

    // 3 = Patrocinador Oficial o Editorial Standard
    if (pageIdx === 3 || slotDef?.type === 'sponsor') {
      return (
        <div className={`mag-page ${slotClass}`}>
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
                  Cada historia ha sido maquetada preservando íntegramente la crónica, la proporción fotográfica original y el rigor estético de nuestras coberturas de sociedad y moda contemporánea.
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

    // Colofón
    if (pageIdx === totalPages - 2 || slotDef?.type === 'colophon') {
      return (
        <div className={`mag-page ${slotClass}`}>
          <div className="mag-page-inner mag-colophon">
            <span className="mag-kicker">COLOFÓN EDITORIAL</span>
            <h3>GLAMORA · REVISTA DIGITAL</h3>
            <p>
              Cochabamba · La Paz · Santa Cruz · Oruro · Potosí · The World.
              Todos los derechos reservados. Prohibida su reproducción o descarga parcial o total sin consentimiento expreso.
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
            <span>GLAMORA · PÁG. {pageNumFormatted}</span>
          </footer>
        </div>
      );
    }

    // Contraportada final
    if (pageIdx === totalPages - 1 || slotDef?.type === 'backcover') {
      return (
        <div className={`mag-page mag-backcover ${slotClass}`}>
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

    // ==========================================
    // PÁGINAS DE ARTÍCULOS (FLUJO FLEXIBLE MULTI-PLIEGO)
    // ==========================================
    if (slotDef && slotDef.type === 'article-page') {
      const { article: currentArticle, spreadDescriptor, slot: pageSlot } = slotDef;

      const photoFilter =
        (currentArticle.id && mergedDesign?.articleFilters?.[currentArticle.id]) ||
        (currentArticle.slug && mergedDesign?.articleFilters?.[currentArticle.slug]) ||
        'natural';
      const focalPoint =
        (currentArticle.id && mergedDesign?.articleFocalPoints?.[currentArticle.id]) ||
        (currentArticle.slug && mergedDesign?.articleFocalPoints?.[currentArticle.slug]) ||
        'center';
      const filterStyleClass = `photo-filter-${photoFilter}`;

      const photoAdjustments: PhotoAdjustments | undefined =
        (currentArticle.id ? mergedDesign?.articlePhotoAdjustments?.[currentArticle.id] : undefined) ||
        (currentArticle.slug ? mergedDesign?.articlePhotoAdjustments?.[currentArticle.slug] : undefined);

      const customFilterCss =
        photoAdjustments && Object.keys(photoAdjustments).length > 0
          ? computePhotoFilterCss(photoFilter, photoAdjustments)
          : undefined;

      const vignetteOverlay = photoAdjustments?.vignette
        ? computeVignetteStyle(photoAdjustments.vignette)
        : null;

      const grainOverlay = photoAdjustments?.grain
        ? computeGrainStyle(photoAdjustments.grain)
        : null;

      const currentLayout: SpreadLayoutStyle =
        (currentArticle.id && mergedDesign.articleLayouts?.[currentArticle.id]) ||
        (currentArticle.slug && mergedDesign.articleLayouts?.[currentArticle.slug]) ||
        'vogue-classic';

      const isCinemaRight = currentLayout === 'cinema-bleed';
      const isLongTitle = (currentArticle.title || '').length > 55;

      // ==========================================
      // LADO IZQUIERDO: VISUAL / FOTOGRÁFICO
      // ==========================================
      if (pageSlot === 'left') {
        // A) PRIMER PLIEGO DE APERTURA: Ejecuta el layout seleccionado por el editor
        if (spreadDescriptor.isFirstSpread) {
          const primaryPhoto =
            (currentArticle.id && mergedDesign?.articleCoverOverrides?.[currentArticle.id]) ||
            (currentArticle.slug && mergedDesign?.articleCoverOverrides?.[currentArticle.slug]) ||
            spreadDescriptor.leftPhotos[0]?.url ||
            getCleanImageUrl(currentArticle.cover_image) ||
            '/brand/glamora-mark.png';
          const cleanGallery = (currentArticle.gallery_images || [])
            .map(getCleanImageUrl)
            .filter(Boolean);
          const secondaryPhoto =
            cleanGallery.find((u) => u !== primaryPhoto) || cleanGallery[0] || primaryPhoto;
          const tertiaryPhoto =
            cleanGallery.filter((u) => u !== primaryPhoto && u !== secondaryPhoto)[0] ||
            secondaryPhoto;

          // 1. Cinema Full Bleed
          if (currentLayout === 'cinema-bleed') {
            return (
              <div className={`mag-page mag-page-cinema-dark ${slotClass}`}>
                <div className="mag-cinema-frame" style={{ position: 'relative' }}>
                  <img
                    src={primaryPhoto}
                    alt={currentArticle.title}
                    draggable={false}
                    className={filterStyleClass}
                    style={{ objectPosition: focalPoint, ...(customFilterCss ? { filter: customFilterCss } : {}) }}
                  />
                  {vignetteOverlay && <div style={vignetteOverlay} />}
                  {grainOverlay && <div style={grainOverlay} />}
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
                  <span>GLAMORA · CINEMA SPREAD</span>
                </footer>
              </div>
            );
          }

          // 2. Glamora Asymmetric Spread
          if (currentLayout === 'vogue-asymmetric') {
            return (
              <div className={`mag-page mag-vogue-asym-left ${slotClass}`}>
                <span className="mag-kicker">
                  GLAMORA SIGNATURE · {(currentArticle.city || 'BOLIVIA').toUpperCase()}
                </span>
                <div className="mag-vogue-asym-spread-stage">
                  <div className="mag-asym-hero-box" style={{ position: 'relative' }}>
                    <img
                      src={primaryPhoto}
                      alt={currentArticle.title}
                      draggable={false}
                      className={filterStyleClass}
                      style={{ objectPosition: focalPoint, ...(customFilterCss ? { filter: customFilterCss } : {}) }}
                    />
                    {vignetteOverlay && <div style={vignetteOverlay} />}
                    {grainOverlay && <div style={grainOverlay} />}
                    <span className="mag-asym-badge">01 · {(currentArticle.event_name || currentArticle.category || 'LOOK PRINCIPAL').toUpperCase()}</span>
                  </div>
                  <div className="mag-asym-split-bottom">
                    <div className="mag-asym-detail-photo">
                      <img
                        src={secondaryPhoto}
                        alt={`${currentArticle.title} detalle`}
                        draggable={false}
                        className={filterStyleClass}
                      />
                      <small>02 · DETALLE</small>
                    </div>
                    <div className="mag-asym-text-block">
                      <strong>{(currentArticle.venue || currentArticle.author || 'ESENCIA EDITORIAL').toUpperCase()}</strong>
                      <p>{currentArticle.excerpt ? `“${currentArticle.excerpt.slice(0, 130)}…”` : 'Crónica visual de alta moda y vida contemporánea.'}</p>
                    </div>
                  </div>
                </div>
                <footer className="mag-page-folio">
                  <span>PÁG. {pageNumFormatted}</span>
                  <span>GLAMORA · THE ASYMMETRIC EDIT</span>
                </footer>
              </div>
            );
          }

          // 3. Glamora Atelier Collage / Moodboard
          if (currentLayout === 'vogue-collage') {
            return (
              <div className={`mag-page mag-envogue-page ${slotClass}`}>
                <div className="mag-envogue-header">
                  <span className="mag-envogue-italic">The</span>
                  <strong className="mag-envogue-masthead">GLAMORA</strong>
                  <span className="mag-envogue-subtitle">ATELIER MOODBOARD · {(currentArticle.category || 'LOOK').toUpperCase()}</span>
                </div>
                <div className="mag-envogue-collage-stage">
                  <div className="mag-envogue-center-hero" style={{ position: 'relative' }}>
                    <img
                      src={primaryPhoto}
                      alt={currentArticle.title}
                      draggable={false}
                      className={filterStyleClass}
                      style={{ objectPosition: focalPoint, ...(customFilterCss ? { filter: customFilterCss } : {}) }}
                    />
                    {vignetteOverlay && <div style={vignetteOverlay} />}
                    {grainOverlay && <div style={grainOverlay} />}
                    <span className="mag-envogue-tag">
                      01 · {(currentArticle.event_name || currentArticle.title).toUpperCase().slice(0, 32)}
                    </span>
                  </div>

                  <div className="mag-envogue-bottom-strip">
                    <div className="mag-envogue-detail-pill">
                      <img src={secondaryPhoto} alt="Detalle 02" draggable={false} className={filterStyleClass} />
                      <small>02 · ENCUADRE</small>
                    </div>
                    <div className="mag-envogue-detail-pill">
                      <img src={tertiaryPhoto} alt="Detalle 03" draggable={false} className={filterStyleClass} />
                      <small>03 · ATMÓSFERA</small>
                    </div>
                  </div>
                </div>
                <footer className="mag-page-folio">
                  <span>PÁG. {pageNumFormatted}</span>
                  <span>MOODBOARD · {(currentArticle.event_name || currentArticle.title).toUpperCase().slice(0, 24)}</span>
                </footer>
              </div>
            );
          }

          // 4. Glamora Social Mosaic
          if (currentLayout === 'social-mosaic') {
            return (
              <div className={`mag-page mag-social-mosaic-left ${slotClass}`}>
                <div className="mag-social-header-banner">
                  <span className="mag-social-pill">GLAMORA SOCIAL</span>
                  <span className="mag-social-venue">
                    {(currentArticle.venue || currentArticle.city || 'BOLIVIA').toUpperCase()}
                  </span>
                </div>
                <div className="mag-social-mosaic-grid">
                  <div className="mag-social-hero-box" style={{ position: 'relative' }}>
                    <img
                      src={primaryPhoto}
                      alt={currentArticle.title}
                      draggable={false}
                      className={filterStyleClass}
                      style={{ objectPosition: focalPoint, ...(customFilterCss ? { filter: customFilterCss } : {}) }}
                    />
                    {vignetteOverlay && <div style={vignetteOverlay} />}
                    {grainOverlay && <div style={grainOverlay} />}
                    <span className="mag-social-tag">01 · AMBIENTE · {currentArticle.venue || currentArticle.title}</span>
                  </div>
                  <div className="mag-social-duo-row">
                    <div className="mag-social-duo-box">
                      <img src={secondaryPhoto} alt="Momento 02" draggable={false} className={filterStyleClass} />
                      <small>02 · COCTELERÍA &amp; SABOR</small>
                    </div>
                    <div className="mag-social-duo-box">
                      <img src={tertiaryPhoto} alt="Momento 03" draggable={false} className={filterStyleClass} />
                      <small>03 · MÚSICA &amp; ESCENA</small>
                    </div>
                  </div>
                </div>
                <footer className="mag-page-folio">
                  <span>PÁG. {pageNumFormatted}</span>
                  <span>GLAMORA SOCIAL · {(currentArticle.city || 'COCHABAMBA').toUpperCase()}</span>
                </footer>
              </div>
            );
          }

          // 5. Glamora Pull-Quote (Retrato de autor)
          if (currentLayout === 'editorial-quote') {
            return (
              <div className={`mag-page mag-quote-spread-left ${slotClass}`}>
                <div className="mag-quote-portrait-plate" style={{ position: 'relative' }}>
                  <img
                    src={primaryPhoto}
                    alt={currentArticle.title}
                    draggable={false}
                    className={filterStyleClass}
                    style={{ objectPosition: focalPoint, ...(customFilterCss ? { filter: customFilterCss } : {}) }}
                  />
                  {vignetteOverlay && <div style={vignetteOverlay} />}
                  {grainOverlay && <div style={grainOverlay} />}
                  <div className="mag-quote-plate-badge">
                    <span>ENTREVISTA DE AUTOR · VOZ EDITORIAL</span>
                  </div>
                </div>
                <footer className="mag-page-folio">
                  <span>PÁG. {pageNumFormatted}</span>
                  <span>GLAMORA · DIÁLOGOS</span>
                </footer>
              </div>
            );
          }

          // 6. Glamora Classic Fashion Plate (Lámina Noble a Página Completa)
          return (
            <div className={`mag-page mag-vogue-classic-left ${slotClass}`}>
              <div className="mag-classic-fashion-plate" style={{ position: 'relative' }}>
                <img
                  src={primaryPhoto}
                  alt={currentArticle.title}
                  draggable={false}
                  className={filterStyleClass}
                  style={{ objectPosition: focalPoint, ...(customFilterCss ? { filter: customFilterCss } : {}) }}
                />
                {vignetteOverlay && <div style={vignetteOverlay} />}
                {grainOverlay && <div style={grainOverlay} />}
                <div className="mag-plate-corner-tag">
                  <span>{(currentArticle.category || 'ALTA MODA').toUpperCase()}</span>
                  <span>{(currentArticle.city || 'BOLIVIA').toUpperCase()}</span>
                </div>
              </div>
              <footer className="mag-page-folio">
                <span>PÁG. {pageNumFormatted}</span>
                <span>GLAMORA · HAUTE ÉDITION</span>
              </footer>
            </div>
          );
        }

        // B) PLIEGOS DE CONTINUACIÓN: Galería Duo, Galería Single o Cita Monumental
        if (spreadDescriptor.leftKind === 'gallery-duo') {
          const photoA = spreadDescriptor.leftPhotos[0];
          const photoB = spreadDescriptor.leftPhotos[1];
          return (
            <div className={`mag-page ${slotClass}`}>
              <div className="mag-gallery-feature-plate">
                <div className="mag-gallery-feature-header">
                  <span>GLAMORA ARCHIVE · {(currentArticle.category || 'SOCIEDAD').toUpperCase()}</span>
                  <small style={{ color: '#8f725f', letterSpacing: '.15em' }}>
                    PLIEGO {spreadDescriptor.spreadIndexInArticle + 1} DE {spreadDescriptor.totalSpreadsInArticle}
                  </small>
                </div>
                <div className="mag-gallery-duo-grid">
                  <div className="mag-gallery-feature-frame">
                    <img
                      src={photoA?.url}
                      alt={photoA?.caption || 'Detalle visual 1'}
                      draggable={false}
                      className={filterStyleClass}
                      style={{ objectPosition: focalPoint }}
                    />
                    {photoA?.caption && (
                      <span className="mag-gallery-duo-tag">{photoA.caption}</span>
                    )}
                  </div>
                  {photoB && (
                    <div className="mag-gallery-feature-frame">
                      <img
                        src={photoB?.url}
                        alt={photoB?.caption || 'Detalle visual 2'}
                        draggable={false}
                        className={filterStyleClass}
                        style={{ objectPosition: focalPoint }}
                      />
                      {photoB?.caption && (
                        <span className="mag-gallery-duo-tag">{photoB.caption}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <footer className="mag-page-folio">
                <span>PÁG. {pageNumFormatted}</span>
                <span>GLAMORA · GALERÍA DE AUTOR</span>
              </footer>
            </div>
          );
        }

        if (spreadDescriptor.leftKind === 'gallery-single') {
          const photo = spreadDescriptor.leftPhotos[0];
          return (
            <div className={`mag-page ${slotClass}`}>
              <div className="mag-gallery-feature-plate">
                <div className="mag-gallery-feature-header">
                  <span>GLAMORA ARCHIVE · {(currentArticle.category || 'SOCIEDAD').toUpperCase()}</span>
                  <small style={{ color: '#8f725f', letterSpacing: '.15em' }}>
                    PLIEGO {spreadDescriptor.spreadIndexInArticle + 1} DE {spreadDescriptor.totalSpreadsInArticle}
                  </small>
                </div>
                <div className="mag-gallery-feature-frame">
                  <img
                    src={photo?.url}
                    alt={photo?.caption || `${currentArticle.title} detalle`}
                    draggable={false}
                    className={filterStyleClass}
                    style={{ objectPosition: focalPoint }}
                  />
                </div>
                {photo?.caption && (
                  <p className="mag-gallery-feature-caption">
                    {photo.caption}
                  </p>
                )}
              </div>
              <footer className="mag-page-folio">
                <span>PÁG. {pageNumFormatted}</span>
                <span>GLAMORA · GALERÍA EDITORIAL</span>
              </footer>
            </div>
          );
        }

        // Cita Monumental de Pliego (Quote Plate)
        const firstTextBlock = spreadDescriptor.rightBlocks.find(
          (b) => b.type !== 'inline-image'
        );
        const quoteFallback =
          firstTextBlock && 'text' in firstTextBlock
            ? firstTextBlock.text.slice(0, 160)
            : 'Elegancia, cultura contemporánea y crónica de autor.';

        return (
          <div className={`mag-page ${slotClass}`}>
            <div className="mag-quote-feature-plate">
              <blockquote>
                {currentArticle.excerpt || quoteFallback}
              </blockquote>
              <cite>
                — {(currentArticle.author || currentArticle.venue || 'GLAMORA EDITORIAL').toUpperCase()}
              </cite>
            </div>
            <footer className="mag-page-folio">
              <span>PÁG. {pageNumFormatted}</span>
              <span>GLAMORA · CITA DESTACADA</span>
            </footer>
          </div>
        );
      }

      // ==========================================
      // LADO DERECHO: CRÓNICA TIPOGRÁFICA
      // ==========================================
      // A) PRIMER PLIEGO: APERTURA DE LA HISTORIA
      if (spreadDescriptor.isFirstSpread) {
        return (
          <div
            className={`mag-page mag-page-story ${
              isCinemaRight ? 'mag-story-cinema' : ''
            } ${slot === 'right' ? 'mag-page-right' : ''}`}
          >
            <div className="mag-page-inner">
              <span
                className="mag-kicker"
                style={isCinemaRight ? { color: '#dfcfbe' } : {}}
              >
                {[
                  currentArticle.id === coverStoryId ? 'COVER STORY' : null,
                  currentArticle.category,
                  currentArticle.city,
                ]
                  .filter(Boolean)
                  .join(' · ')
                  .toUpperCase()}
              </span>

              <h3
                className="mag-story-headline"
                style={{
                  fontSize: isLongTitle ? 'clamp(20px, 2.3vw, 29px)' : undefined,
                  color: isCinemaRight ? '#fcfaf6' : undefined,
                }}
              >
                {currentArticle.title}
              </h3>

              {currentArticle.author && (
                <div
                  className="mag-story-byline"
                  style={isCinemaRight ? { color: '#baa89b' } : {}}
                >
                  POR {currentArticle.author.toUpperCase()}
                </div>
              )}

              {currentArticle.excerpt && (
                <p
                  className="mag-pull-quote"
                  style={
                    isCinemaRight
                      ? {
                          background: 'rgba(255,255,255,0.06)',
                          color: '#dfcfbe',
                          borderColor: '#dfcfbe',
                        }
                      : {}
                  }
                >
                  &ldquo;{currentArticle.excerpt}&rdquo;
                </p>
              )}

              <div
                className="mag-story-columns"
                style={isCinemaRight ? { color: '#dfdcd7' } : {}}
              >
                {spreadDescriptor.rightBlocks.map((block: EditorialBlock, bIdx: number) => {
                  if (block.type === 'heading') {
                    return (
                      <h4 key={bIdx} className="mag-story-subheading">
                        {block.text}
                      </h4>
                    );
                  }
                  if (block.type === 'quote') {
                    return (
                      <blockquote key={bIdx} className="mag-story-quote-callout">
                        &ldquo;{block.text}&rdquo;
                      </blockquote>
                    );
                  }
                  if (block.type === 'inline-image') {
                    return (
                      <figure key={bIdx} className="mag-inline-photo-box">
                        <img
                          src={block.url}
                          alt={block.caption || 'Fotografía editorial'}
                          draggable={false}
                          className={filterStyleClass}
                        />
                        {block.caption && (
                          <figcaption className="mag-inline-photo-caption">
                            {block.caption}
                          </figcaption>
                        )}
                      </figure>
                    );
                  }
                  return (
                    <p key={bIdx} className={bIdx === 0 ? 'mag-story-dropcap' : ''}>
                      {block.text}
                    </p>
                  );
                })}
              </div>

              {/* Si es el único pliego, muestra los protagonistas y cierre */}
              {!spreadDescriptor.hasMoreAfter && (
                <>
                  {Array.isArray(currentArticle.people_tags) &&
                    currentArticle.people_tags.filter(Boolean).length > 0 && (
                      <div
                        className="mag-story-people"
                        style={isCinemaRight ? { color: '#baa89b' } : {}}
                      >
                        <span>PROTAGONISTAS: </span>
                        {currentArticle.people_tags.filter(Boolean).slice(0, 5).join(' · ')}
                      </div>
                    )}
                  <div className="mag-story-end-signoff">
                    <span>GLAMORA EDITORIAL</span>
                    <small>FIN DE LA HISTORIA ❖</small>
                  </div>
                </>
              )}

              {/* Si continúa en el pliego siguiente, muestra el pase de página editorial */}
              {spreadDescriptor.hasMoreAfter && (
                <div className="mag-story-continuation-cue">
                  <button
                    type="button"
                    onClick={() => goToPage(spreadDescriptor.rightPageNumber + 1)}
                    className="mag-story-next-page-btn"
                  >
                    CONTINÚA EN LA PÁGINA SIGUIENTE (PÁG. {String(spreadDescriptor.rightPageNumber + 1).padStart(2, '0')}) →
                  </button>
                </div>
              )}
            </div>

            <footer
              className="mag-page-folio"
              style={isCinemaRight ? { color: '#baa89b' } : {}}
            >
              <span>GLAMORA · {issueTitle.toUpperCase()}</span>
              <span>PÁG. {pageNumFormatted}</span>
            </footer>
          </div>
        );
      }

      // B) PLIEGOS DE CONTINUACIÓN: DESARROLLO Y CONCLUSIÓN DE LA CRÓNICA
      return (
        <div
          className={`mag-page mag-page-story ${
            isCinemaRight ? 'mag-story-cinema' : ''
          } ${slot === 'right' ? 'mag-page-right' : ''}`}
        >
          <div className="mag-page-inner">
            <span className="mag-continuation-kicker">
              CONTINUACIÓN · {(currentArticle.category || 'CRÓNICA').toUpperCase()}
            </span>
            <h4 className="mag-continuation-headline">
              {currentArticle.title}
            </h4>

            <div
              className="mag-story-columns"
              style={isCinemaRight ? { color: '#dfdcd7' } : {}}
            >
              {spreadDescriptor.rightBlocks.map((block: EditorialBlock, bIdx: number) => {
                if (block.type === 'heading') {
                  return (
                    <h4 key={bIdx} className="mag-story-subheading">
                      {block.text}
                    </h4>
                  );
                }
                if (block.type === 'quote') {
                  return (
                    <blockquote key={bIdx} className="mag-story-quote-callout">
                      &ldquo;{block.text}&rdquo;
                    </blockquote>
                  );
                }
                if (block.type === 'inline-image') {
                  return (
                    <figure key={bIdx} className="mag-inline-photo-box">
                      <img
                        src={block.url}
                        alt={block.caption || 'Fotografía editorial'}
                        draggable={false}
                        className={filterStyleClass}
                      />
                      {block.caption && (
                        <figcaption className="mag-inline-photo-caption">
                          {block.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                }
                return <p key={bIdx}>{block.text}</p>;
              })}
            </div>

            {/* Protagonistas y firma editorial al concluir */}
            {spreadDescriptor.isLastSpread && (
              <>
                {Array.isArray(currentArticle.people_tags) &&
                  currentArticle.people_tags.filter(Boolean).length > 0 && (
                    <div
                      className="mag-story-people"
                      style={isCinemaRight ? { color: '#baa89b' } : {}}
                    >
                      <span>PROTAGONISTAS: </span>
                      {currentArticle.people_tags.filter(Boolean).slice(0, 5).join(' · ')}
                    </div>
                  )}
                <div className="mag-story-end-signoff">
                  <span>GLAMORA EDITORIAL</span>
                  <small>FIN DE LA HISTORIA ❖</small>
                </div>
              </>
            )}

            {/* Si aún continúa en un pliego adicional */}
            {spreadDescriptor.hasMoreAfter && (
              <div className="mag-story-continuation-cue">
                <button
                  type="button"
                  onClick={() => goToPage(spreadDescriptor.rightPageNumber + 1)}
                  className="mag-story-next-page-btn"
                >
                  CONTINÚA EN LA PÁGINA SIGUIENTE (PÁG. {String(spreadDescriptor.rightPageNumber + 1).padStart(2, '0')}) →
                </button>
              </div>
            )}
          </div>

          <footer
            className="mag-page-folio"
            style={isCinemaRight ? { color: '#baa89b' } : {}}
          >
            <span>GLAMORA · {issueTitle.toUpperCase()}</span>
            <span>PÁG. {pageNumFormatted}</span>
          </footer>
        </div>
      );
    }

    return null;
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
              {allowPrintGuides && (
                <button
                  type="button"
                  className={`mag-reader-top-btn ${showPrintGuides ? 'mag-reader-guide-active' : ''}`}
                  onClick={() => setShowPrintGuides((prev) => !prev)}
                  title="Conmutar guías editoriales de corte, sangrado y zona segura (213 × 276 mm)"
                >
                  📏 GUÍAS IMPRESIÓN {showPrintGuides ? '● ON' : '○ OFF'}
                </button>
              )}
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
                {showPrintGuides && (
                  <div className="mag-print-guides-overlay mag-print-guides-mobile" aria-hidden="true">
                    <div className="mag-guide-bleed-box">
                      <span className="mag-guide-tag mag-tag-bleed-top">SANGRADO +3mm</span>
                    </div>
                    <span className="mag-crop-mark mag-crop-tl" />
                    <span className="mag-crop-mark mag-crop-tr" />
                    <span className="mag-crop-mark mag-crop-bl" />
                    <span className="mag-crop-mark mag-crop-br" />
                    <div className="mag-guide-safe-single">
                      <span className="mag-guide-tag mag-tag-safe">ZONA SEGURA 12mm</span>
                    </div>
                    <div className="mag-guide-hud-bar">
                      <span>213 × 276 mm · SEGURO 12mm</span>
                      <span>300 DPI</span>
                    </div>
                  </div>
                )}
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
                {showPrintGuides && (
                  <div className="mag-print-guides-overlay" aria-hidden="true">
                    <div className="mag-guide-bleed-box">
                      <span className="mag-guide-tag mag-tag-bleed-top">SANGRADO TÉCNICO (+3mm)</span>
                    </div>
                    <span className="mag-crop-mark mag-crop-tl" />
                    <span className="mag-crop-mark mag-crop-tr" />
                    <span className="mag-crop-mark mag-crop-bl" />
                    <span className="mag-crop-mark mag-crop-br" />
                    <div className="mag-guide-safe-left">
                      <span className="mag-guide-tag mag-tag-safe">ZONA SEGURA 12mm</span>
                    </div>
                    <div className="mag-guide-spine-axis">
                      <span className="mag-guide-tag mag-tag-spine">PLIEGUE CENTRAL · LOMO</span>
                    </div>
                    <div className="mag-guide-safe-right">
                      <span className="mag-guide-tag mag-tag-safe">ZONA SEGURA 12mm</span>
                    </div>
                    <div className="mag-guide-hud-bar">
                      <span>HAUTE COUTURE FORMAT · 213 × 276 mm (PLIEGO 426 × 276 mm)</span>
                      <span>SANGRADO: 3 mm · CORTE: EXACTO · MARGEN SEGURO: 12 mm · PRENSA: 300 DPI</span>
                    </div>
                  </div>
                )}
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
                          : `PÁG. ${String(idx * 2).padStart(2, '0')}–${String(idx * 2 + 1).padStart(2, '0')}`;
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
