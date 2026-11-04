'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { Article } from '@/lib/data';

type SocialCanvasFormat = '4:5' | '9:16' | '1:1' | '16:9';

type SocialTemplateMode =
  | 'watermark-only'
  | 'editorial-cover'
  | 'pull-quote'
  | 'social-event';

type WatermarkPosition =
  | 'top-center'
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left';

type WatermarkTone = 'champagne' | 'ivory' | 'obsidian';

type WatermarkStyle = 'emblem-full' | 'monogram-g' | 'masthead-only';

const FORMAT_DIMENSIONS: Record<
  SocialCanvasFormat,
  { width: number; height: number; label: string; subtitle: string }
> = {
  '4:5': {
    width: 1080,
    height: 1350,
    label: '4:5 · Feed IG / Meta Business',
    subtitle: '1080 × 1350 px (Máximo alcance en Feed)',
  },
  '9:16': {
    width: 1080,
    height: 1920,
    label: '9:16 · Story / Reel / TikTok / WP',
    subtitle: '1080 × 1920 px (Vertical pantalla completa)',
  },
  '1:1': {
    width: 1080,
    height: 1080,
    label: '1:1 · Post Cuadrado / Carrusel',
    subtitle: '1080 × 1080 px',
  },
  '16:9': {
    width: 1920,
    height: 1080,
    label: '16:9 · Horizontal FB / X',
    subtitle: '1920 × 1080 px',
  },
};

const TONE_HEX: Record<WatermarkTone, string> = {
  champagne: '#e7c7b4',
  ivory: '#fbf7f2',
  obsidian: '#18141c',
};

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function GlamoraSocialStudioPage() {
  const db = supabaseBrowser();
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [ready, setReady] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [availableArticlePhotos, setAvailableArticlePhotos] = useState<string[]>([]);

  // Imagen cargada en el lienzo
  const [imageSrc, setImageSrc] = useState('');
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Parámetros del compositor visual
  const [format, setFormat] = useState<SocialCanvasFormat>('4:5');
  const [template, setTemplate] = useState<SocialTemplateMode>('editorial-cover');
  const [fitMode, setFitMode] = useState<'cover' | 'contain-luxury'>('cover');
  const [zoom, setZoom] = useState(100);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [gradientStrength, setGradientStrength] = useState(58);

  // Parámetros de Marca de Agua GLAMORA
  const [watermarkStyle, setWatermarkStyle] = useState<WatermarkStyle>('emblem-full');
  const [watermarkPos, setWatermarkPos] = useState<WatermarkPosition>('bottom-right');
  const [watermarkTone, setWatermarkTone] = useState<WatermarkTone>('champagne');
  const [watermarkOpacity, setWatermarkOpacity] = useState(90);
  const [watermarkScale, setWatermarkScale] = useState(100);
  const [watermarkSubtext, setWatermarkSubtext] = useState('ESTILO · CULTURA · SOCIEDAD');

  // Textos editoriales sobre la pieza
  const [kicker, setKicker] = useState('MODA · COCHABAMBA');
  const [headline, setHeadline] = useState('La nueva elegancia contemporánea en Bolivia');
  const [subhead, setSubhead] = useState('POR GLAMORA EDITORIAL · LEER EN GLAMORA');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await db.auth.getUser();

      if (!user || user.email?.toLowerCase() !== 'legarage1014@gmail.com') {
        router.replace('/admin/login');
        return;
      }

      const { data } = await db
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const list = (data || []) as Article[];
      setArticles(list);
      if (list[0]) {
        applyArticleToStudio(list[0]);
      }
      setReady(true);
    })();
  }, []);

  function applyArticleToStudio(art: Article) {
    setSelectedArticleId(art.id);
    const photos = [
      art.cover_image,
      ...(Array.isArray(art.gallery_images) ? art.gallery_images : []),
    ].filter(Boolean) as string[];
    setAvailableArticlePhotos(photos);

    if (photos[0]) {
      setImageSrc(photos[0]);
    }
    setKicker(
      [
        art.is_social ? 'GLAMORA SOCIAL' : art.category || 'EDITORIAL',
        art.city || 'BOLIVIA',
      ]
        .filter(Boolean)
        .join(' · ')
        .toUpperCase()
    );
    setHeadline(art.event_name || art.title || '');
    setSubhead(
      art.author
        ? `POR ${art.author.toUpperCase()} · GLAMORA`
        : art.venue
          ? `${art.venue.toUpperCase()} · GLAMORA`
          : 'LEER HISTORIA EN GLAMORA'
    );
  }

  function handleLocalFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    setZoom(100);
    setOffsetX(0);
    setOffsetY(0);
    setStatusMessage(`Fotografía "${file.name}" cargada en el lienzo.`);
  }

  // Cargar objeto HTMLImageElement cada vez que cambia imageSrc
  useEffect(() => {
    if (!imageSrc) {
      setLoadedImage(null);
      return;
    }
    let active = true;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (active) setLoadedImage(img);
    };
    img.onerror = () => {
      if (active) setLoadedImage(null);
    };
    img.src = imageSrc;
    return () => {
      active = false;
    };
  }, [imageSrc]);

  // Renderizado en vivo sobre el Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = FORMAT_DIMENSIONS[format];
    canvas.width = width;
    canvas.height = height;

    // 1. Fondo base oscuro de lujo
    ctx.fillStyle = '#151219';
    ctx.fillRect(0, 0, width, height);

    // 2. Dibujar fotografía con Zoom y Desplazamiento X/Y
    if (loadedImage) {
      ctx.save();
      if (fitMode === 'contain-luxury') {
        const pad = Math.round(width * 0.065);
        const boxX = pad;
        const boxY = Math.round(height * 0.11);
        const boxW = width - pad * 2;
        const boxH =
          template === 'watermark-only'
            ? height - Math.round(height * 0.22)
            : Math.round(height * 0.58);

        ctx.fillStyle = '#1e1a24';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        ctx.beginPath();
        ctx.rect(boxX, boxY, boxW, boxH);
        ctx.clip();

        const baseScale = Math.min(
          boxW / loadedImage.width,
          boxH / loadedImage.height
        );
        const finalScale = baseScale * (zoom / 100);
        const drawW = loadedImage.width * finalScale;
        const drawH = loadedImage.height * finalScale;
        const shiftX = (offsetX / 100) * (boxW * 0.6);
        const shiftY = (offsetY / 100) * (boxH * 0.6);
        const drawX = boxX + (boxW - drawW) / 2 + shiftX;
        const drawY = boxY + (boxH - drawH) / 2 + shiftY;

        ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);

        ctx.strokeStyle = 'rgba(231, 199, 180, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxW, boxH);
      } else {
        const baseScale = Math.max(
          width / loadedImage.width,
          height / loadedImage.height
        );
        const finalScale = baseScale * (zoom / 100);
        const drawW = loadedImage.width * finalScale;
        const drawH = loadedImage.height * finalScale;
        const shiftX = (offsetX / 100) * (width * 0.6);
        const shiftY = (offsetY / 100) * (height * 0.6);
        const drawX = (width - drawW) / 2 + shiftX;
        const drawY = (height - drawH) / 2 + shiftY;

        ctx.drawImage(loadedImage, drawX, drawY, drawW, drawH);
      }
      ctx.restore();
    }

    // 3. Degradado editorial para legibilidad
    if (gradientStrength > 0) {
      const alpha = Math.min(0.92, gradientStrength / 100);
      const grad = ctx.createLinearGradient(0, height * 0.32, 0, height);
      grad.addColorStop(0, 'rgba(18, 14, 22, 0)');
      grad.addColorStop(0.55, `rgba(18, 14, 22, ${(alpha * 0.62).toFixed(2)})`);
      grad.addColorStop(1, `rgba(15, 12, 19, ${alpha.toFixed(2)})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Sutil viñeta superior si la marca de agua está arriba
      if (watermarkPos.startsWith('top') || template === 'editorial-cover') {
        const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.26);
        topGrad.addColorStop(0, `rgba(15, 12, 19, ${(alpha * 0.7).toFixed(2)})`);
        topGrad.addColorStop(1, 'rgba(15, 12, 19, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, width, height * 0.26);
      }
    }

    // Marco interior fino de revista
    const borderInset = Math.round(width * 0.038);
    ctx.strokeStyle = 'rgba(231, 199, 180, 0.26)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      borderInset,
      borderInset,
      width - borderInset * 2,
      height - borderInset * 2
    );

    const accentColor = TONE_HEX[watermarkTone];

    // 4. Contenido según la Plantilla Editorial seleccionada
    if (template !== 'watermark-only') {
      const textPadding = Math.round(width * 0.085);
      const maxTextW = width - textPadding * 2;

      if (template === 'pull-quote') {
        ctx.textAlign = 'center';
        ctx.fillStyle = accentColor;
        ctx.font = `400 ${Math.round(width * 0.12)}px Georgia, serif`;
        ctx.fillText('“', width / 2, height * 0.56);

        ctx.fillStyle = '#fbf7f2';
        const fontSize = Math.round(width * 0.048);
        ctx.font = `italic ${fontSize}px Georgia, serif`;
        const lines = wrapTextLines(ctx, headline, maxTextW).slice(0, 4);
        let y = height * 0.61;
        for (const line of lines) {
          ctx.fillText(line, width / 2, y);
          y += fontSize * 1.24;
        }

        if (kicker) {
          ctx.fillStyle = accentColor;
          ctx.font = `600 ${Math.round(width * 0.019)}px sans-serif`;
          ctx.fillText(kicker.toUpperCase(), width / 2, y + 26);
        }
      } else {
        // 'editorial-cover' o 'social-event'
        ctx.textAlign = 'center';
        const bottomAnchor = height - Math.round(height * 0.14);

        const titleFontSize = Math.round(width * 0.052);
        ctx.font = `400 ${titleFontSize}px Georgia, serif`;
        const titleLines = wrapTextLines(ctx, headline, maxTextW).slice(0, 3);
        const totalTitleHeight = titleLines.length * (titleFontSize * 1.18);

        let startY = bottomAnchor - totalTitleHeight;

        // Kicker arriba del titular
        if (kicker) {
          ctx.fillStyle = accentColor;
          ctx.font = `600 ${Math.round(width * 0.019)}px sans-serif`;
          ctx.fillText(kicker.toUpperCase(), width / 2, startY - 34);
        }

        // Titular principal
        ctx.fillStyle = '#fbf7f2';
        ctx.font = `400 ${titleFontSize}px Georgia, serif`;
        for (const line of titleLines) {
          ctx.fillText(line, width / 2, startY);
          startY += titleFontSize * 1.18;
        }

        // Subhead / Firma
        if (subhead) {
          ctx.fillStyle = 'rgba(246, 238, 229, 0.78)';
          ctx.font = `400 ${Math.round(width * 0.017)}px sans-serif`;
          ctx.fillText(subhead.toUpperCase(), width / 2, startY + 14);
        }
      }
    }

    // 5. Dibujar Marca de Agua Oficial GLAMORA (Posición, escala y opacidad personalizables)
    ctx.save();
    ctx.globalAlpha = Math.max(0.15, Math.min(1, watermarkOpacity / 100));
    const wmScale = watermarkScale / 100;
    const padX = Math.round(width * 0.075);
    const padY = Math.round(height * 0.075);

    let wmX = width / 2;
    let wmY = padY;
    let align: CanvasTextAlign = 'center';

    if (watermarkPos === 'top-left') {
      wmX = padX;
      wmY = padY + 24;
      align = 'left';
    } else if (watermarkPos === 'top-right') {
      wmX = width - padX;
      wmY = padY + 24;
      align = 'right';
    } else if (watermarkPos === 'top-center') {
      wmX = width / 2;
      wmY = padY + 34;
      align = 'center';
    } else if (watermarkPos === 'bottom-left') {
      wmX = padX;
      wmY = height - padY - 12;
      align = 'left';
    } else if (watermarkPos === 'bottom-right') {
      wmX = width - padX;
      wmY = height - padY - 12;
      align = 'right';
    } else if (watermarkPos === 'bottom-center') {
      wmX = width / 2;
      wmY = height - padY - 12;
      align = 'center';
    }

    ctx.textAlign = align;
    ctx.fillStyle = accentColor;
    const monogramSize = Math.round(width * 0.048 * wmScale);
    const wordmarkSize = Math.round(width * 0.044 * wmScale);
    const subSize = Math.round(width * 0.012 * wmScale);
    const editorialFont = '"Cormorant Garamond", Didot, "Bodoni MT", Georgia, serif';

    if (watermarkStyle === 'monogram-g') {
      ctx.font = `400 ${Math.round(monogramSize * 1.35)}px ${editorialFont}`;
      ctx.fillText('G', wmX, wmY - subSize * 0.6);
      if (watermarkSubtext.trim()) {
        ctx.fillStyle = watermarkTone === 'obsidian' ? '#18141c' : '#fbf7f2';
        ctx.font = `500 ${subSize}px sans-serif`;
        ctx.fillText('G L A M O R A', wmX, wmY + subSize * 1.4);
      }
    } else if (watermarkStyle === 'masthead-only') {
      ctx.fillStyle = watermarkTone === 'obsidian' ? '#18141c' : '#fbf7f2';
      ctx.font = `400 ${Math.round(wordmarkSize * 1.12)}px ${editorialFont}`;
      ctx.fillText('G L A M O R A', wmX, wmY);
      if (watermarkSubtext.trim()) {
        ctx.fillStyle = accentColor;
        ctx.font = `500 ${subSize}px sans-serif`;
        ctx.fillText(
          watermarkSubtext.trim().toUpperCase(),
          wmX,
          wmY + subSize * 1.65
        );
      }
    } else {
      ctx.font = `400 ${monogramSize}px ${editorialFont}`;
      ctx.fillText('G', wmX, wmY - wordmarkSize * 0.9);

      ctx.fillStyle = watermarkTone === 'obsidian' ? '#18141c' : '#fbf7f2';
      ctx.font = `400 ${wordmarkSize}px ${editorialFont}`;
      ctx.fillText('G L A M O R A', wmX, wmY);

      if (watermarkSubtext.trim()) {
        ctx.fillStyle = accentColor;
        ctx.font = `500 ${subSize}px sans-serif`;
        ctx.fillText(
          watermarkSubtext.trim().toUpperCase(),
          wmX,
          wmY + subSize * 1.65
        );
      }
    }
    ctx.restore();
  }, [
    loadedImage,
    format,
    template,
    fitMode,
    zoom,
    offsetX,
    offsetY,
    gradientStrength,
    watermarkStyle,
    watermarkPos,
    watermarkTone,
    watermarkOpacity,
    watermarkScale,
    watermarkSubtext,
    kicker,
    headline,
    subhead,
  ]);

  function handleDownloadSocialCard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
    const link = document.createElement('a');
    const cleanSlug =
      headline
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'glamora';
    link.href = dataUrl;
    link.download = `glamora-${format.replace(':', 'x')}-${cleanSlug}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage('Pieza descargada en alta resolución lista para publicar ✓');
  }

  const generatedCaption = `${headline}\n\n${kicker} — Descubre la cobertura y galería completa en nuestra edición digital de GLAMORA.\n\n#Glamora #GlamoraBolivia #GlamoraSocial #Bolivia #Estilo #Cultura #Sociedad`;

  async function handleCopyCaption() {
    try {
      await navigator.clipboard.writeText(generatedCaption);
      setStatusMessage('Copy y hashtags copiados para Meta Business Suite / TikTok ✓');
    } catch {
      setStatusMessage('No se pudo copiar automáticamente.');
    }
  }

  if (!ready) {
    return (
      <main className="admin-shell">
        <div className="admin-state">Cargando GLAMORA Social Studio…</div>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <div className="admin-top">
        <strong className="admin-wordmark">
          GLAMORA <span>STUDIO</span>
        </strong>
        <nav className="admin-top-nav" aria-label="Navegación del estudio">
          <a href="/admin">DASHBOARD</a>
          <a href="/admin/issues">THE ISSUES (REVISTA)</a>
          <a href="/admin/social-studio" aria-current="page">
            SOCIAL STUDIO
          </a>
          <a href="/admin/agenda">AGENDA</a>
          <a href="/admin/produccion">PRODUCCIÓN</a>
          <a href="/admin/sponsors">PATROCINIOS</a>
        </nav>

        <button
          type="button"
          className="button-primary"
          onClick={() => router.push('/admin')}
        >
          VOLVER AL PANEL
        </button>
      </div>

      <div className="admin-content">
        <div className="eyebrow">
          META BUSINESS SUITE · INSTAGRAM · TIKTOK · WHATSAPP · MARCA DE AGUA OFICIAL
        </div>
        <h1 className="admin-page-title">GLAMORA Social Media Studio</h1>
        <p>
          Sube cualquier fotografía o selecciona una nota publicada, ajusta el encuadre al milímetro, aplica la marca de agua oficial de GLAMORA y descarga piezas listas para Feed (4:5), Stories/Reels (9:16), Carruseles (1:1) o Meta Business Suite.
        </p>

        {statusMessage && <p className="status">{statusMessage}</p>}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.05fr) minmax(300px, .95fr)',
            gap: 24,
            alignItems: 'start',
          }}
          className="social-studio-layout"
        >
          {/* COLUMNA IZQUIERDA: CONTROLES DEL ESTUDIO */}
          <div style={{ display: 'grid', gap: 18 }}>
            {/* 1. ORIGEN DE LA FOTOGRAFÍA */}
            <section className="admin-panel" style={{ margin: 0 }}>
              <div className="eyebrow">1 · ORIGEN DE LA FOTOGRAFÍA</div>
              <h2 style={{ font: '22px Georgia', fontWeight: 400, margin: '6px 0 12px' }}>
                Subir foto propia o elegir de una publicación
              </h2>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLocalFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="button-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  SUBIR FOTOGRAFÍA DESDE DISPOSITIVO ↑
                </button>
              </div>

              <label style={{ display: 'grid', gap: 6, fontSize: 10, letterSpacing: '.14em' }}>
                O CARGAR DESDE UN ARTÍCULO / COBERTURA DE GLAMORA
                <select
                  value={selectedArticleId}
                  onChange={(e) => {
                    const found = articles.find((a) => a.id === e.target.value);
                    if (found) applyArticleToStudio(found);
                  }}
                  style={{ padding: '10px 12px', border: '1px solid #d9cfc6', fontSize: 13 }}
                >
                  {articles.map((art) => (
                    <option key={art.id} value={art.id}>
                      {art.title} ({art.category})
                    </option>
                  ))}
                </select>
              </label>

              {availableArticlePhotos.length > 1 && (
                <div style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 10, letterSpacing: '.14em', color: '#756b68', display: 'block', marginBottom: 8 }}>
                    FOTOGRAFÍAS DE ESTA COBERTURA (CLIC PARA ELEGIR):
                  </span>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {availableArticlePhotos.map((photoUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImageSrc(photoUrl);
                          setZoom(100);
                          setOffsetX(0);
                          setOffsetY(0);
                        }}
                        style={{
                          width: 58,
                          height: 72,
                          padding: 0,
                          border:
                            imageSrc === photoUrl
                              ? '2px solid #711c32'
                              : '1px solid #d9cfc6',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={photoUrl}
                          alt={`Foto ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 2. FORMATO DE RED SOCIAL Y PLANTILLA */}
            <section className="admin-panel" style={{ margin: 0 }}>
              <div className="eyebrow">2 · FORMATO PARA REDES &amp; ESTILO VISUAL</div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: 10,
                  marginTop: 12,
                  marginBottom: 14,
                }}
              >
                {(Object.keys(FORMAT_DIMENSIONS) as SocialCanvasFormat[]).map((key) => {
                  const info = FORMAT_DIMENSIONS[key];
                  const active = format === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormat(key)}
                      style={{
                        padding: '12px 12px',
                        border: active ? '1.5px solid #211b1d' : '1px solid #dfd5cb',
                        background: active ? '#211b1d' : '#fbfaf7',
                        color: active ? '#fbf7f2' : '#211b1d',
                        textAlign: 'left',
                        cursor: 'pointer',
                      }}
                    >
                      <strong style={{ display: 'block', fontSize: 11, letterSpacing: '.12em' }}>
                        {info.label}
                      </strong>
                      <small style={{ fontSize: 10, opacity: 0.78 }}>{info.subtitle}</small>
                    </button>
                  );
                })}
              </div>

              <label style={{ display: 'grid', gap: 6, fontSize: 10, letterSpacing: '.14em' }}>
                PLANTILLA EDITORIAL
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value as SocialTemplateMode)}
                  style={{ padding: '10px 12px', border: '1px solid #d9cfc6', fontSize: 13 }}
                >
                  <option value="watermark-only">
                    Solo Marca de Agua Oficial (Fotografía Limpia para Álbumes Sociales)
                  </option>
                  <option value="editorial-cover">
                    Portada Editorial (Marca de Agua + Categoría + Titular + Firma)
                  </option>
                  <option value="pull-quote">
                    Cita / Frase Destacada (Comillas de Lujo + Frase + Marca de Agua)
                  </option>
                  <option value="social-event">
                    Cobertura Glamora Social (Sello Evento + Ciudad + Marca de Agua)
                  </option>
                </select>
              </label>
            </section>

            {/* 3. ENCUADRE MILIMÉTRICO DE LA FOTO */}
            <section className="admin-panel" style={{ margin: 0 }}>
              <div className="eyebrow">3 · AJUSTE Y ENCUADRE DE LA FOTOGRAFÍA</div>
              <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                <label style={{ display: 'grid', gap: 6, fontSize: 10, letterSpacing: '.14em' }}>
                  MODO DE ENCUADRE
                  <select
                    value={fitMode}
                    onChange={(e) =>
                      setFitMode(e.target.value as 'cover' | 'contain-luxury')
                    }
                    style={{ padding: '9px 12px', border: '1px solid #d9cfc6', fontSize: 12 }}
                  >
                    <option value="cover">Llenar todo el lienzo (Full Bleed)</option>
                    <option value="contain-luxury">
                      Marco Interior Editorial (Muestra 100% de la foto sin recortar)
                    </option>
                  </select>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ fontSize: 10, letterSpacing: '.14em' }}>
                    ZOOM ({zoom}%)
                    <input
                      type="range"
                      min={60}
                      max={220}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </label>

                  <label style={{ fontSize: 10, letterSpacing: '.14em' }}>
                    VELO EDITORIAL OSCURO ({gradientStrength}%)
                    <input
                      type="range"
                      min={0}
                      max={90}
                      value={gradientStrength}
                      onChange={(e) => setGradientStrength(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </label>

                  <label style={{ fontSize: 10, letterSpacing: '.14em' }}>
                    POSICIÓN HORIZONTAL X ({offsetX}%)
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={offsetX}
                      onChange={(e) => setOffsetX(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </label>

                  <label style={{ fontSize: 10, letterSpacing: '.14em' }}>
                    POSICIÓN VERTICAL Y ({offsetY}%)
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={offsetY}
                      onChange={(e) => setOffsetY(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setZoom(100);
                    setOffsetX(0);
                    setOffsetY(0);
                  }}
                >
                  RESTABLECER ENCUADRE CENTRAL ↺
                </button>
              </div>
            </section>

            {/* 4. MARCA DE AGUA OFICIAL Y TEXTOS */}
            <section className="admin-panel" style={{ margin: 0 }}>
              <div className="eyebrow">4 · MARCA DE AGUA GLAMORA &amp; TITULARES</div>
              <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                <label style={{ display: 'grid', gap: 5, fontSize: 10, letterSpacing: '.14em' }}>
                  ESTILO DE MARCA DE AGUA UHD (SELLO VECTORIAL)
                  <select
                    value={watermarkStyle}
                    onChange={(e) => setWatermarkStyle(e.target.value as WatermarkStyle)}
                    style={{ padding: '8px 10px', border: '1px solid #d9cfc6', fontSize: 12 }}
                  >
                    <option value="emblem-full">Emblema Completo (Monograma G + GLAMORA + Leyenda)</option>
                    <option value="monogram-g">Sello Corto Minimalista (Monograma G + Micro-Glamora)</option>
                    <option value="masthead-only">Cabecera Editorial (Solo G L A M O R A)</option>
                  </select>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ display: 'grid', gap: 5, fontSize: 10, letterSpacing: '.14em' }}>
                    POSICIÓN DE LA MARCA DE AGUA
                    <select
                      value={watermarkPos}
                      onChange={(e) =>
                        setWatermarkPos(e.target.value as WatermarkPosition)
                      }
                      style={{ padding: '8px 10px', border: '1px solid #d9cfc6', fontSize: 12 }}
                    >
                      <option value="top-center">Arriba · Centro (Cabecera Revista)</option>
                      <option value="bottom-right">Abajo · Derecha (Sello Social)</option>
                      <option value="bottom-center">Abajo · Centro</option>
                      <option value="bottom-left">Abajo · Izquierda</option>
                      <option value="top-right">Arriba · Derecha</option>
                      <option value="top-left">Arriba · Izquierda</option>
                    </select>
                  </label>

                  <label style={{ display: 'grid', gap: 5, fontSize: 10, letterSpacing: '.14em' }}>
                    COLOR DE MARCA DE AGUA
                    <select
                      value={watermarkTone}
                      onChange={(e) =>
                        setWatermarkTone(e.target.value as WatermarkTone)
                      }
                      style={{ padding: '8px 10px', border: '1px solid #d9cfc6', fontSize: 12 }}
                    >
                      <option value="champagne">Champagne Dorado &amp; Marfil</option>
                      <option value="ivory">Blanco Puro Editorial</option>
                      <option value="obsidian">Negro Obsidiana</option>
                    </select>
                  </label>

                  <label style={{ fontSize: 10, letterSpacing: '.14em' }}>
                    TAMAÑO DEL SELLO ({watermarkScale}%)
                    <input
                      type="range"
                      min={65}
                      max={145}
                      value={watermarkScale}
                      onChange={(e) => setWatermarkScale(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </label>

                  <label style={{ fontSize: 10, letterSpacing: '.14em' }}>
                    OPACIDAD DEL SELLO ({watermarkOpacity}%)
                    <input
                      type="range"
                      min={25}
                      max={100}
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </label>
                </div>

                <label style={{ display: 'grid', gap: 5, fontSize: 10, letterSpacing: '.14em' }}>
                  LEYENDA BAJO EL LOGO GLAMORA
                  <input
                    value={watermarkSubtext}
                    onChange={(e) => setWatermarkSubtext(e.target.value)}
                    placeholder="REVISTA DIGITAL · BOLIVIA"
                    style={{ padding: '8px 10px', border: '1px solid #d9cfc6', fontSize: 12 }}
                  />
                </label>

                {template !== 'watermark-only' && (
                  <>
                    <label style={{ display: 'grid', gap: 5, fontSize: 10, letterSpacing: '.14em' }}>
                      CATEGORÍA / CIUDAD (KICKER)
                      <input
                        value={kicker}
                        onChange={(e) => setKicker(e.target.value)}
                        style={{ padding: '8px 10px', border: '1px solid #d9cfc6', fontSize: 12 }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: 5, fontSize: 10, letterSpacing: '.14em' }}>
                      TITULAR O CITA EN LA PIEZA
                      <textarea
                        rows={2}
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        style={{ padding: '8px 10px', border: '1px solid #d9cfc6', fontSize: 13 }}
                      />
                    </label>

                    <label style={{ display: 'grid', gap: 5, fontSize: 10, letterSpacing: '.14em' }}>
                      CRÉDITO / LLAMADO INFERIOR
                      <input
                        value={subhead}
                        onChange={(e) => setSubhead(e.target.value)}
                        style={{ padding: '8px 10px', border: '1px solid #d9cfc6', fontSize: 12 }}
                      />
                    </label>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: PREVISUALIZADOR EN VIVO Y EXPORTACIÓN */}
          <div style={{ position: 'sticky', top: 20, display: 'grid', gap: 16 }}>
            <section
              className="admin-panel"
              style={{ margin: 0, textAlign: 'center', background: '#19161f', color: '#f6efe7' }}
            >
              <div className="eyebrow" style={{ color: '#e7c7b4', marginBottom: 10 }}>
                LIENZO EN VIVO · {FORMAT_DIMENSIONS[format].label}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 10,
                  background: '#110e15',
                  border: '1px solid rgba(231, 199, 180, .2)',
                }}
              >
                <canvas
                  ref={canvasRef}
                  style={{
                    width: '100%',
                    maxWidth: format === '16:9' ? 480 : 340,
                    height: 'auto',
                    display: 'block',
                    boxShadow: '0 18px 46px rgba(0,0,0,.55)',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={handleDownloadSocialCard}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    border: '1px solid #e7c7b4',
                    background: '#e7c7b4',
                    color: '#17131c',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '.22em',
                    cursor: 'pointer',
                  }}
                >
                  DESCARGAR IMAGEN HD CON MARCA DE AGUA ↓
                </button>
              </div>
            </section>

            <section className="admin-panel" style={{ margin: 0 }}>
              <div className="eyebrow">COPY AUTOMÁTICO PARA META BUSINESS SUITE / TIKTOK</div>
              <textarea
                readOnly
                rows={5}
                value={generatedCaption}
                style={{
                  width: '100%',
                  marginTop: 8,
                  marginBottom: 10,
                  padding: 10,
                  border: '1px solid #dfd5cb',
                  background: '#fbf9f5',
                  fontSize: 12,
                }}
              />
              <button
                type="button"
                className="button-primary"
                onClick={handleCopyCaption}
              >
                COPIAR TEXTO Y HASHTAGS ↗
              </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
