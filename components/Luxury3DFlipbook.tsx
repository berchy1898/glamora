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
  const [pdfPages, setPdfPages] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Web Audio API: Synthesize realistic silk paper turn sound
  const playPaperSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = Math.floor(ctx.sampleRate * 0.18);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const decay = Math.exp(-i / (ctx.sampleRate * 0.04));
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      filter.Q.value = 1.4;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.17);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
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

        // Render each page into a data URL
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 2.0 }); // 2x Retina resolution
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const context = canvas.getContext('2d');
          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            renderedPages.push(canvas.toDataURL('image/webp', 0.92));
          }
        }

        if (isMounted) {
          setPdfPages(renderedPages);
          setLoadingPdf(false);
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

  // Keyboard navigation (ArrowLeft / ArrowRight / Escape)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        <div className={`flipbook-book-body ${spreadIndex === 0 ? 'single-cover' : 'double-spread'} ${isFlipping ? `flipping-${flipDirection}` : ''}`}>
          {/* Left Page (If Spread > 0) */}
          {spreadIndex > 0 && (
            <div className="flipbook-page-leaf left-page">
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
          <div className={`flipbook-page-leaf right-page ${spreadIndex === 0 ? 'cover-leaf' : ''}`}>
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
        </div>

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
