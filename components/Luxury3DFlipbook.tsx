'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export interface FlipbookSpread {
  id: string;
  leftPageNum: number;
  rightPageNum: number;
  leftImage?: string;
  rightImage?: string;
  leftCanvas?: HTMLCanvasElement;
  rightCanvas?: HTMLCanvasElement;
  label?: string;
  section?: string;
}

interface Luxury3DFlipbookProps {
  pdfUrl?: string | null;
  pageImages?: string[];
  issueTitle: string;
  issueNumber: number | string;
  coverImage?: string | null;
  onClose?: () => void;
  defaultOpen?: boolean;
}

export function Luxury3DFlipbook({
  pdfUrl,
  pageImages = [],
  issueTitle,
  issueNumber,
  coverImage,
  onClose,
  defaultOpen = true,
}: Luxury3DFlipbookProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [spreadIndex, setSpreadIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [loupeActive, setLoupeActive] = useState(false);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number; bgX: number; bgY: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<{ done: number; total: number } | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [zoomScale, setZoomScale] = useState<1 | 1.35 | 1.75>(1);
  const [privacyBlur, setPrivacyBlur] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Web Audio API: Multi-layered natural glossy magazine page-turn acoustics
  const playPaperSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const duration = 0.34;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink-like noise (smoother, warmer paper texture than harsh white noise)
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.2965164;
        b2 = 0.57 * b2 + white * 1.0526913;
        data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
      }

      // Layer 1: Finger lift & paper slide sweep
      const slideSrc = ctx.createBufferSource();
      slideSrc.buffer = buffer;
      const slideFilter = ctx.createBiquadFilter();
      slideFilter.type = 'bandpass';
      slideFilter.frequency.setValueAtTime(620, now);
      slideFilter.frequency.exponentialRampToValueAtTime(1650, now + 0.16);
      slideFilter.Q.value = 1.1;
      const slideGain = ctx.createGain();
      slideGain.gain.setValueAtTime(0.001, now);
      slideGain.gain.linearRampToValueAtTime(0.14, now + 0.05);
      slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      slideSrc.connect(slideFilter);
      slideFilter.connect(slideGain);
      slideGain.connect(ctx.destination);
      slideSrc.start(now);

      // Layer 2: Soft air whoosh of the turning spread
      const airSrc = ctx.createBufferSource();
      airSrc.buffer = buffer;
      const airFilter = ctx.createBiquadFilter();
      airFilter.type = 'lowpass';
      airFilter.frequency.setValueAtTime(440, now + 0.04);
      airFilter.frequency.exponentialRampToValueAtTime(170, now + 0.29);
      const airGain = ctx.createGain();
      airGain.gain.setValueAtTime(0.001, now + 0.04);
      airGain.gain.linearRampToValueAtTime(0.16, now + 0.14);
      airGain.gain.exponentialRampToValueAtTime(0.001, now + 0.31);
      airSrc.connect(airFilter);
      airFilter.connect(airGain);
      airGain.connect(ctx.destination);
      airSrc.start(now + 0.03);

      // Layer 3: Gentle paper settle against the opposite page
      const settleSrc = ctx.createBufferSource();
      settleSrc.buffer = buffer;
      const settleFilter = ctx.createBiquadFilter();
      settleFilter.type = 'bandpass';
      settleFilter.frequency.setValueAtTime(2100, now + 0.22);
      settleFilter.Q.value = 1.8;
      const settleGain = ctx.createGain();
      settleGain.gain.setValueAtTime(0.001, now + 0.22);
      settleGain.gain.linearRampToValueAtTime(0.06, now + 0.245);
      settleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);
      settleSrc.connect(settleFilter);
      settleFilter.connect(settleGain);
      settleGain.connect(ctx.destination);
      settleSrc.start(now + 0.22);
    } catch {
      // Audio autoplay blocked or unsupported
    }
  }, [soundEnabled]);

  // Load PDF via PDF.js if a pdfUrl is supplied
  useEffect(() => {
    if (!pdfUrl) return;

    let isMounted = true;
    setLoadingPdf(true);

    async function loadPdfDocument() {
      try {
        // Load PDF.js from trusted CDN dynamically
        if (!(window as any).pdfjsLib) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load PDF.js'));
            document.head.appendChild(script);
          });
        }

        const pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const loadingTask = pdfjs.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const renderedPages: string[] = [];
        if (isMounted) setPdfProgress({ done: 0, total: pdf.numPages });

        // Render progressively: Page 1 shows immediately, remaining pages stream in background
        for (let p = 1; p <= pdf.numPages; p++) {
          if (!isMounted) break;
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 2.0 }); // 2x Retina resolution
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            renderedPages.push(canvas.toDataURL('image/webp', 0.92));
            if (isMounted) {
              setPdfProgress({ done: p, total: pdf.numPages });
              if (p === 1 || p % 2 === 0 || p === pdf.numPages) {
                setPdfPages([...renderedPages]);
              }
              if (p === 1) {
                setLoadingPdf(false);
              }
            }
          }
        }

        if (isMounted) {
          setPdfPages([...renderedPages]);
          setLoadingPdf(false);
          setPdfProgress(null);
        }
      } catch (err) {
        console.error('[GLAMORA FLIPBOOK] Error al renderizar PDF:', err);
        if (isMounted) setLoadingPdf(false);
      }
    }

    loadPdfDocument();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Source of pages: either rendered PDF, passed images, or default fallback cover
  const allPages = pdfPages.length > 0 ? pdfPages : pageImages.length > 0 ? pageImages : [coverImage || '/brand/glamora-mark.png'];

  // Organize pages into spreads (Spread 0 = Cover alone, Spread 1 = P2 & P3, etc.)
  const spreads: FlipbookSpread[] = [];
  
  // Pliego 0: Portada
  spreads.push({
    id: 'spread-0-cover',
    leftPageNum: 0,
    rightPageNum: 1,
    leftImage: undefined,
    rightImage: allPages[0],
    label: 'Portada Principal',
    section: 'COVER',
  });

  // Pliegos Interiores: Páginas de 2 en 2
  for (let i = 1; i < allPages.length; i += 2) {
    const left = allPages[i];
    const right = allPages[i + 1];
    spreads.push({
      id: `spread-${Math.floor(i / 2) + 1}`,
      leftPageNum: i + 1,
      rightPageNum: right ? i + 2 : i + 1,
      leftImage: left,
      rightImage: right,
      label: `Pliego ${Math.floor(i / 2) + 1}`,
      section: 'EDITORIAL',
    });
  }

  const currentSpread = spreads[spreadIndex] || spreads[0];

  const goNext = useCallback(() => {
    if (spreadIndex >= spreads.length - 1 || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('next');
    playPaperSound();
    setTimeout(() => {
      setSpreadIndex((prev) => Math.min(spreads.length - 1, prev + 1));
      setIsFlipping(false);
      setFlipDirection(null);
    }, 450);
  }, [spreadIndex, spreads.length, isFlipping, playPaperSound]);

  const goPrev = useCallback(() => {
    if (spreadIndex <= 0 || isFlipping) return;
    setIsFlipping(true);
    setFlipDirection('prev');
    playPaperSound();
    setTimeout(() => {
      setSpreadIndex((prev) => Math.max(0, prev - 1));
      setIsFlipping(false);
      setFlipDirection(null);
    }, 450);
  }, [spreadIndex, isFlipping, playPaperSound]);

  // Keyboard navigation + anti-copy / anti-print / screenshot-deterrent protection
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const keyLower = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'u', 'c'].includes(keyLower)) {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c', 's'].includes(keyLower)) {
        e.preventDefault();
        return;
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setPrivacyBlur(true);
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'PageDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') goPrev();
      if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen().catch(() => {});
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    }
    function handleBlur() {
      setPrivacyBlur(true);
    }
    function handleFocus() {
      setPrivacyBlur(false);
    }
    function handleVisibility() {
      if (document.hidden) setPrivacyBlur(true);
    }
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [goNext, goPrev, isFullscreen, onClose]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Loupe Macro move handler
  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!loupeActive || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;
    setLoupePos({ x, y, bgX, bgY });
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`flipbook-theater ${isFullscreen ? 'fullscreen' : ''}`}
      role="dialog"
      aria-label={`Lector Flipbook 3D - GLAMORA The Issue Nº ${issueNumber}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Top Floating Control Bar (Vogue Style Champagne & Obsidian) */}
      <header className="flipbook-topbar">
        <div className="flipbook-brand">
          <span className="brand-primary">GLAMORA</span>
          <span className="brand-sep">/</span>
          <span className="brand-italic">The Issue</span>
          <span className="brand-edition">Nº {String(issueNumber).padStart(2, '0')}</span>
        </div>

        {/* Spread indicator */}
        <div className="flipbook-spread-meta">
          {spreadIndex === 0 ? (
            <span>PORTADA OFICIAL</span>
          ) : (
            <span>
              PÁGINAS {currentSpread.leftPageNum} – {currentSpread.rightPageNum}
              <small>({spreadIndex + 1} DE {spreads.length})</small>
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flipbook-actions">
          {/* Sound toggle */}
          <button
            type="button"
            className={`flipbook-btn ${soundEnabled ? 'active' : ''}`}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar sonido de papel' : 'Activar sonido de papel'}
          >
            {soundEnabled ? '🔊 SONIDO' : '🔇 MUDO'}
          </button>

          {/* Zoom toggle */}
          <button
            type="button"
            className={`flipbook-btn ${zoomScale > 1 ? 'active' : ''}`}
            onClick={() =>
              setZoomScale((prev) => (prev === 1 ? 1.35 : prev === 1.35 ? 1.75 : 1))
            }
            title="Acercar páginas (Zoom)"
          >
            🔎 {zoomScale === 1 ? 'ZOOM' : `${zoomScale}×`}
          </button>

          {/* Loupe toggle */}
          <button
            type="button"
            className={`flipbook-btn ${loupeActive ? 'active' : ''}`}
            onClick={() => {
              setLoupeActive(!loupeActive);
              if (loupeActive) setLoupePos(null);
            }}
            title="Lupa Macro de Alta Costura"
          >
            🔍 LUPA
          </button>

          {/* Thumbnails tray toggle */}
          <button
            type="button"
            className={`flipbook-btn ${showThumbnails ? 'active' : ''}`}
            onClick={() => setShowThumbnails(!showThumbnails)}
            title="Ver sumario de pliegos"
          >
            📑 PLIEGOS
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            className="flipbook-btn"
            onClick={toggleFullscreen}
            title="Modo Zen Pantalla Completa"
          >
            {isFullscreen ? '✕ PANTALLA' : '⛶ ZEN'}
          </button>

          {/* Close */}
          {onClose && (
            <button
              type="button"
              className="flipbook-close-btn"
              onClick={onClose}
              title="Cerrar Lector"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Main 3D Book Stage */}
      <div
        ref={stageRef}
        className="flipbook-stage"
        onMouseMove={handleStageMouseMove}
        onMouseLeave={() => setLoupePos(null)}
        onTouchStart={(e) => {
          touchStartXRef.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartXRef.current === null || zoomScale > 1) return;
          const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
          const delta = endX - touchStartXRef.current;
          touchStartXRef.current = null;
          if (delta < -48) goNext();
          else if (delta > 48) goPrev();
        }}
      >
        {/* Navigation Arrow Left */}
        <button
          type="button"
          className="flipbook-side-nav prev"
          onClick={goPrev}
          disabled={spreadIndex === 0 || isFlipping}
          aria-label="Pliego anterior"
        >
          ‹
        </button>

        {/* The 3D Magazine Open Spread */}
        <div
          className={`flipbook-book-body ${spreadIndex === 0 ? 'single-cover' : 'double-spread'} ${isFlipping ? `flipping-${flipDirection}` : ''}`}
          style={{
            ...(zoomScale > 1
              ? { transform: `scale(${zoomScale})`, transformOrigin: 'center center', transition: 'transform .28s ease' }
              : {}),
            ...(privacyBlur ? { filter: 'blur(22px) brightness(.45)', transition: 'filter .15s ease' } : {}),
          }}
        >
          {/* Left Page (If Spread > 0) */}
          {spreadIndex > 0 && (
            <div
              className="flipbook-page-leaf left-page"
              onClick={() => {
                if (!loupeActive && zoomScale === 1) goPrev();
              }}
              style={{ cursor: !loupeActive && zoomScale === 1 ? 'w-resize' : undefined }}
            >
              <div className="leaf-content">
                {currentSpread.leftImage ? (
                  <div className="page-media-wrap">
                    <Image
                      src={currentSpread.leftImage}
                      alt={`Página ${currentSpread.leftPageNum}`}
                      fill
                      unoptimized={currentSpread.leftImage.startsWith('http') || currentSpread.leftImage.startsWith('data:')}
                      className="page-image"
                      priority
                    />
                  </div>
                ) : (
                  <div className="page-empty">
                    <span className="folio-brand">GLAMORA</span>
                    <span className="folio-num">{currentSpread.leftPageNum}</span>
                  </div>
                )}
              </div>
              {/* Paper Lighting & Gutter Spine Shadow */}
              <div className="leaf-inner-shadow" />
            </div>
          )}

          {/* Right Page */}
          <div
            className={`flipbook-page-leaf right-page ${spreadIndex === 0 ? 'cover-leaf' : ''}`}
            onClick={() => {
              if (!loupeActive && zoomScale === 1) goNext();
            }}
            style={{ cursor: !loupeActive && zoomScale === 1 ? 'e-resize' : undefined }}
          >
            <div className="leaf-content">
              {currentSpread.rightImage ? (
                <div className="page-media-wrap">
                  <Image
                    src={currentSpread.rightImage}
                    alt={spreadIndex === 0 ? 'Portada' : `Página ${currentSpread.rightPageNum}`}
                    fill
                    unoptimized={currentSpread.rightImage.startsWith('http') || currentSpread.rightImage.startsWith('data:')}
                    className="page-image"
                    priority
                  />
                </div>
              ) : (
                <div className="page-empty">
                  <span className="folio-brand">GLAMORA</span>
                  <span className="folio-num">{currentSpread.rightPageNum}</span>
                </div>
              )}
            </div>
            {/* Paper Lighting & Spine Shadow */}
            <div className="leaf-inner-shadow" />
          </div>

          {/* Realistic 3D Central Gutter Spine */}
          {spreadIndex > 0 && <div className="flipbook-center-spine" aria-hidden="true" />}

          {/* Subtle Editorial Watermark Overlay */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              zIndex: 6,
            }}
          >
            <span
              style={{
                transform: 'rotate(-24deg)',
                fontSize: 'clamp(12px, 1.5vw, 18px)',
                letterSpacing: '.34em',
                color: 'rgba(217, 185, 164, .16)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                fontWeight: 600,
              }}
            >
              GLAMORA · THE ISSUE Nº {String(issueNumber).padStart(2, '0')} · LECTURA PROTEGIDA
            </span>
          </div>
        </div>

        {privacyBlur && (
          <div
            onClick={() => setPrivacyBlur(false)}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 30,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(15, 13, 18, .45)',
              cursor: 'pointer',
            }}
          >
            <div style={{ padding: '18px 26px', border: '1px solid #d9b9a4', background: '#15131a', color: '#f7f5f0', textAlign: 'center' }}>
              <div style={{ fontSize: 9, letterSpacing: '.22em', color: '#d9b9a4', marginBottom: 6 }}>LECTURA PROTEGIDA</div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 20 }}>Haz clic aquí para continuar leyendo</div>
            </div>
          </div>
        )}

        {/* Navigation Arrow Right */}
        <button
          type="button"
          className="flipbook-side-nav next"
          onClick={goNext}
          disabled={spreadIndex >= spreads.length - 1 || isFlipping}
          aria-label="Pliego siguiente"
        >
          ›
        </button>

        {/* Floating Macro Loupe */}
        {loupeActive && loupePos && (
          <div
            className="flipbook-macro-loupe"
            style={{
              left: `${loupePos.x}px`,
              top: `${loupePos.y}px`,
              backgroundImage: `url(${currentSpread.rightImage || currentSpread.leftImage})`,
              backgroundPosition: `${loupePos.bgX}% ${loupePos.bgY}%`,
            }}
          />
        )}
      </div>

      {/* Bottom Thumbnail Tray (Slide-up Strip) */}
      {showThumbnails && (
        <aside className="flipbook-thumbnails-tray">
          <div className="tray-header">
            <span>SUMARIO DE PLIEGOS DE LA EDICIÓN</span>
            <button type="button" onClick={() => setShowThumbnails(false)}>✕ CERRAR</button>
          </div>
          <div className="tray-scroll">
            {spreads.map((spread, idx) => (
              <button
                key={spread.id}
                type="button"
                className={`thumb-item ${spreadIndex === idx ? 'active' : ''}`}
                onClick={() => {
                  setSpreadIndex(idx);
                  playPaperSound();
                }}
              >
                <div className="thumb-spread-preview">
                  {spread.leftImage && (
                    <div className="thumb-page">
                      <Image src={spread.leftImage} alt="" fill unoptimized className="thumb-img" />
                    </div>
                  )}
                  {spread.rightImage && (
                    <div className="thumb-page">
                      <Image src={spread.rightImage} alt="" fill unoptimized className="thumb-img" />
                    </div>
                  )}
                </div>
                <span className="thumb-label">
                  {idx === 0 ? 'Portada' : `Pliego ${idx}`}
                </span>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Bottom Interactive Scrubber Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          padding: '8px 20px 12px',
          background: 'rgba(15, 13, 18, .92)',
          borderTop: '1px solid rgba(217, 185, 164, .18)',
          color: '#d9b9a4',
          fontSize: 10,
          letterSpacing: '.16em',
        }}
      >
        <span>{String(spreadIndex + 1).padStart(2, '0')} / {String(spreads.length).padStart(2, '0')}</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, spreads.length - 1)}
          value={spreadIndex}
          onChange={(e) => {
            const target = Number(e.target.value);
            if (target !== spreadIndex) {
              setSpreadIndex(target);
              playPaperSound();
            }
          }}
          aria-label="Navegar entre pliegos"
          style={{ width: 'min(360px, 48vw)', accentColor: '#d9b9a4', cursor: 'pointer' }}
        />
        {pdfProgress && (
          <span style={{ color: 'rgba(247, 245, 240, .7)', fontSize: 9 }}>
            PDF {pdfProgress.done}/{pdfProgress.total}
          </span>
        )}
        <span style={{ color: 'rgba(217, 185, 164, .75)', fontSize: 9, letterSpacing: '.14em' }}>
          🔒 EDICIÓN PROTEGIDA
        </span>
      </div>

      {/* Loading PDF spinner indicator */}
      {loadingPdf && (
        <div className="flipbook-pdf-loader">
          <div className="loader-box">
            <span className="loader-glamora">GLAMORA</span>
            <p>Renderizando páginas en Ultra-HD...</p>
          </div>
        </div>
      )}
    </div>
  );
}
