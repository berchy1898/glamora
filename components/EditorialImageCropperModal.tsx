'use client';

import { useEffect, useRef, useState } from 'react';
import { optimizeEditorialImage } from '@/lib/media-optimizer';

export type EditorialAspectPreset = 'vertical' | 'horizontal' | 'original';

type EditorialImageCropperModalProps = {
  file: File | null;
  defaultPreset?: EditorialAspectPreset;
  title?: string;
  onConfirm: (standardizedFile: File) => void;
  onCancel: () => void;
};

export const PRESET_CONFIG: Record<
  'vertical' | 'horizontal',
  { width: number; height: number; ratioLabel: string; label: string; description: string }
> = {
  vertical: {
    width: 1200,
    height: 1600,
    ratioLabel: '3:4',
    label: 'PORTADA VERTICAL (3:4)',
    description: '1200 × 1600 px · Formato oficial de revista (Recomendado)',
  },
  horizontal: {
    width: 1600,
    height: 900,
    ratioLabel: '16:9',
    label: 'PORTADA HORIZONTAL (16:9)',
    description: '1600 × 900 px · Formato panorámico apaisado',
  },
};

export function EditorialImageCropperModal({
  file,
  defaultPreset = 'vertical',
  title = 'Encuadre Editorial de Portada',
  onConfirm,
  onCancel,
}: EditorialImageCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [preset, setPreset] = useState<EditorialAspectPreset>(defaultPreset);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(100);
  const [panX, setPanX] = useState(0); // -100 (izquierda) a 100 (derecha)
  const [panY, setPanY] = useState(0); // -100 (arriba) a 100 (abajo)
  const [showGuides, setShowGuides] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Arrastre interactivo con mouse o touch
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Si la imagen es horizontal por naturaleza (ancho > alto), sugerir horizontal si no se especificó
    setPreset(defaultPreset);
    setZoom(100);
    setPanX(0);
    setPanY(0);
  }, [file, defaultPreset]);

  useEffect(() => {
    if (!file) {
      setImgObj(null);
      return;
    }
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setImgObj(image);
      // Sugerencia inteligente de formato inicial según la orientación de la foto
      if (defaultPreset === 'vertical' && image.width > image.height * 1.3) {
        setPreset('horizontal');
      }
    };
    image.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, defaultPreset]);

  // Dibujar en el canvas con estricto WYSIWYG (lo que ves es exactamente lo que se exporta)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let targetW = 1200;
    let targetH = 1600;

    if (preset === 'horizontal') {
      targetW = 1600;
      targetH = 900;
    } else if (preset === 'original') {
      targetW = imgObj.width;
      targetH = imgObj.height;
    }

    canvas.width = targetW;
    canvas.height = targetH;

    // Limpiar canvas
    ctx.clearRect(0, 0, targetW, targetH);

    // Calcular escala para CUBRIR completamente el marco (sin bordes negros)
    const baseScale =
      preset === 'original'
        ? 1
        : Math.max(targetW / imgObj.width, targetH / imgObj.height);

    const currentScale = baseScale * (zoom / 100);
    const drawW = imgObj.width * currentScale;
    const drawH = imgObj.height * currentScale;

    // El desplazamiento máximo asegura que la foto NUNCA se salga del marco dejando vacíos
    const maxShiftX = Math.max(0, (drawW - targetW) / 2);
    const maxShiftY = Math.max(0, (drawH - targetH) / 2);

    const drawX = (targetW - drawW) / 2 + (panX / 100) * maxShiftX;
    const drawY = (targetH - drawH) / 2 + (panY / 100) * maxShiftY;

    // Dibujar imagen
    ctx.drawImage(imgObj, drawX, drawY, drawW, drawH);

    // Dibujar guías visuales sutiles de composición (regla de los tercios)
    if (showGuides && preset !== 'original') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = Math.max(1, Math.round(targetW / 800));

      // Líneas verticales de tercios
      ctx.beginPath();
      ctx.moveTo(targetW / 3, 0);
      ctx.lineTo(targetW / 3, targetH);
      ctx.moveTo((targetW * 2) / 3, 0);
      ctx.lineTo((targetW * 2) / 3, targetH);

      // Líneas horizontales de tercios
      ctx.moveTo(0, targetH / 3);
      ctx.lineTo(targetW, targetH / 3);
      ctx.moveTo(0, (targetH * 2) / 3);
      ctx.lineTo(targetW, (targetH * 2) / 3);
      ctx.stroke();

      ctx.restore();
    }
  }, [imgObj, preset, zoom, panX, panY, showGuides]);

  if (!file) return null;

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    // Sensibilidad fluida para ajustar posición con mouse o dedo
    setPanX((prev) => Math.max(-100, Math.min(100, prev + dx * 0.45)));
    setPanY((prev) => Math.max(-100, Math.min(100, prev + dy * 0.45)));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  }

  async function handleConfirmCrop() {
    if (!imgObj || !file || processing) return;
    setProcessing(true);

    try {
      // Si eligió original sin zoom ni desplazamiento, optimizar directo
      if (preset === 'original' && zoom === 100 && panX === 0 && panY === 0) {
        const opt = await optimizeEditorialImage(file);
        onConfirm(opt);
        return;
      }

      let targetW = 1200;
      let targetH = 1600;

      if (preset === 'horizontal') {
        targetW = 1600;
        targetH = 900;
      } else if (preset === 'original') {
        targetW = Math.min(1800, imgObj.width);
        targetH = Math.round((targetW / imgObj.width) * imgObj.height);
      }

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = targetW;
      exportCanvas.height = targetH;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        const opt = await optimizeEditorialImage(file);
        onConfirm(opt);
        return;
      }

      const baseScale =
        preset === 'original'
          ? targetW / imgObj.width
          : Math.max(targetW / imgObj.width, targetH / imgObj.height);

      const currentScale = baseScale * (zoom / 100);
      const drawW = imgObj.width * currentScale;
      const drawH = imgObj.height * currentScale;

      const maxShiftX = Math.max(0, (drawW - targetW) / 2);
      const maxShiftY = Math.max(0, (drawH - targetH) / 2);

      const drawX = (targetW - drawW) / 2 + (panX / 100) * maxShiftX;
      const drawY = (targetH - drawH) / 2 + (panY / 100) * maxShiftY;

      // Dibujar exactamente sin guías para el archivo final
      ctx.drawImage(imgObj, drawX, drawY, drawW, drawH);

      const blob = await new Promise<Blob | null>((resolve) =>
        exportCanvas.toBlob(resolve, 'image/webp', 0.92)
      );

      if (!blob) {
        const opt = await optimizeEditorialImage(file);
        onConfirm(opt);
        return;
      }

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const standardizedFile = new File(
        [blob],
        `${baseName}-${preset}.webp`,
        {
          type: 'image/webp',
          lastModified: Date.now(),
        }
      );

      onConfirm(standardizedFile);
    } finally {
      setProcessing(false);
    }
  }

  function handleReset() {
    setZoom(100);
    setPanX(0);
    setPanY(0);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(12, 10, 15, 0.88)',
        backdropFilter: 'blur(10px)',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 920,
          maxHeight: '92vh',
          background: '#ffffff',
          borderRadius: 6,
          boxShadow: '0 24px 70px rgba(0,0,0,.65)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          overflow: 'hidden',
          border: '1px solid rgba(31, 26, 23, .12)',
        }}
      >
        {/* Cabecera del modal */}
        <header
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #eee8e2',
            background: '#faf7f2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontSize: 8.5,
                fontWeight: 600,
                letterSpacing: '.24em',
                color: '#711c32',
                marginBottom: 3,
                textTransform: 'uppercase',
              }}
            >
              GLAMORA STUDIO · ENCUADRE DE PORTADA
            </span>
            <strong
              style={{
                font: '400 18px/1.2 var(--font-editorial, Georgia, serif)',
                color: '#17151a',
              }}
            >
              {title}
            </strong>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '6px 14px',
              border: '1px solid #d9d0c7',
              background: '#ffffff',
              color: '#332b26',
              fontSize: 9,
              letterSpacing: '.18em',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            CERRAR ✕
          </button>
        </header>

        {/* Cuerpo del encuadre */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(280px, 1fr)',
            gap: 28,
            alignItems: 'center',
          }}
        >
          {/* Escenario del Canvas con marco exacto */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#151218',
              borderRadius: 4,
              padding: '20px',
              minHeight: 380,
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'inline-block',
                boxShadow: '0 16px 40px rgba(0,0,0,.6)',
                border: '1px solid rgba(255, 255, 255, .15)',
              }}
            >
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  maxHeight: preset === 'horizontal' ? '300px' : '440px',
                  width: 'auto',
                  height: 'auto',
                  cursor: isDragging.current ? 'grabbing' : 'grab',
                  touchAction: 'none',
                }}
              />
            </div>

            <small
              style={{
                marginTop: 12,
                color: '#a89d93',
                fontSize: 9.5,
                letterSpacing: '.08em',
              }}
            >
              Arrastra con el mouse o dedo sobre la imagen para mover el encuadre
            </small>
          </div>

          {/* Panel de Controles */}
          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: '.18em',
                  color: '#711c32',
                  marginBottom: 10,
                  textTransform: 'uppercase',
                }}
              >
                1. FORMATO DE LA PORTADA
              </label>

              <div style={{ display: 'grid', gap: 8 }}>
                {/* BOTÓN VERTICAL 3:4 */}
                <button
                  type="button"
                  onClick={() => {
                    setPreset('vertical');
                    setPanX(0);
                    setPanY(0);
                  }}
                  style={{
                    padding: '12px 14px',
                    border:
                      preset === 'vertical'
                        ? '1.5px solid #711c32'
                        : '1px solid #dfd5cb',
                    background: preset === 'vertical' ? '#faf3f4' : '#ffffff',
                    color: preset === 'vertical' ? '#711c32' : '#211b1d',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 2,
                    transition: 'all .15s ease',
                  }}
                >
                  <span style={{ fontSize: 20 }}>▯</span>
                  <div>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: 11,
                        letterSpacing: '.12em',
                      }}
                    >
                      PORTADA VERTICAL (3:4)
                    </strong>
                    <small style={{ fontSize: 9.5, opacity: 0.85 }}>
                      1200 × 1600 px · Proporción clásica de revista de lujo
                    </small>
                  </div>
                </button>

                {/* BOTÓN HORIZONTAL 16:9 */}
                <button
                  type="button"
                  onClick={() => {
                    setPreset('horizontal');
                    setPanX(0);
                    setPanY(0);
                  }}
                  style={{
                    padding: '12px 14px',
                    border:
                      preset === 'horizontal'
                        ? '1.5px solid #711c32'
                        : '1px solid #dfd5cb',
                    background: preset === 'horizontal' ? '#faf3f4' : '#ffffff',
                    color: preset === 'horizontal' ? '#711c32' : '#211b1d',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 2,
                    transition: 'all .15s ease',
                  }}
                >
                  <span style={{ fontSize: 20 }}>▭</span>
                  <div>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: 11,
                        letterSpacing: '.12em',
                      }}
                    >
                      PORTADA HORIZONTAL (16:9)
                    </strong>
                    <small style={{ fontSize: 9.5, opacity: 0.85 }}>
                      1600 × 900 px · Proporción panorámica / cinematográfica
                    </small>
                  </div>
                </button>

                {/* BOTÓN ORIGINAL */}
                <button
                  type="button"
                  onClick={() => {
                    setPreset('original');
                    setPanX(0);
                    setPanY(0);
                    setZoom(100);
                  }}
                  style={{
                    padding: '9px 14px',
                    border:
                      preset === 'original'
                        ? '1.5px solid #711c32'
                        : '1px solid #dfd5cb',
                    background: preset === 'original' ? '#faf3f4' : '#ffffff',
                    color: preset === 'original' ? '#711c32' : '#211b1d',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderRadius: 2,
                    transition: 'all .15s ease',
                  }}
                >
                  <span style={{ fontSize: 16 }}>◰</span>
                  <div>
                    <strong
                      style={{
                        display: 'block',
                        fontSize: 10.5,
                        letterSpacing: '.12em',
                      }}
                    >
                      PROPORCIÓN ORIGINAL DE CÁMARA
                    </strong>
                    <small style={{ fontSize: 9, opacity: 0.8 }}>
                      Sin recortar bordes (Mantiene las proporciones de tu archivo)
                    </small>
                  </div>
                </button>
              </div>
            </div>

            {/* CONTROLES DE ZOOM Y AJUSTE */}
            {preset !== 'original' && (
              <div
                style={{
                  background: '#fcfaf7',
                  border: '1px solid #eee8e2',
                  padding: '14px',
                  borderRadius: 3,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <label
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '.16em',
                      color: '#473d36',
                      textTransform: 'uppercase',
                    }}
                  >
                    2. ZOOM ({zoom}%)
                  </label>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 8.5,
                      color: '#711c32',
                      cursor: 'pointer',
                      letterSpacing: '.12em',
                      textDecoration: 'underline',
                    }}
                  >
                    REINICIAR
                  </button>
                </div>

                <input
                  type="range"
                  min={100}
                  max={220}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#711c32' }}
                />

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                    marginTop: 4,
                  }}
                >
                  <label style={{ fontSize: 8.5, letterSpacing: '.12em', color: '#554a43' }}>
                    HORIZONTAL ({Math.round(panX)}%)
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={panX}
                      onChange={(e) => setPanX(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#711c32' }}
                    />
                  </label>

                  <label style={{ fontSize: 8.5, letterSpacing: '.12em', color: '#554a43' }}>
                    VERTICAL ({Math.round(panY)}%)
                    <input
                      type="range"
                      min={-100}
                      max={100}
                      value={panY}
                      onChange={(e) => setPanY(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#711c32' }}
                    />
                  </label>
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 9,
                    color: '#63564e',
                    cursor: 'pointer',
                    marginTop: 4,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showGuides}
                    onChange={(e) => setShowGuides(e.target.checked)}
                    style={{ accentColor: '#711c32' }}
                  />
                  Mostrar guías de tercios fotográficos
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Barra de acciones inferior */}
        <footer
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #eee8e2',
            background: '#faf7f2',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <small style={{ color: '#776c64', fontSize: 9.5 }}>
            El resultado final será idéntico al recuadro de la vista previa.
          </small>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '9px 18px',
                border: '1px solid #d9d0c7',
                background: '#ffffff',
                color: '#332b26',
                fontSize: 9,
                letterSpacing: '.18em',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              CANCELAR
            </button>

            <button
              type="button"
              onClick={handleConfirmCrop}
              disabled={processing}
              style={{
                padding: '9px 24px',
                border: '1px solid #711c32',
                background: '#711c32',
                color: '#ffffff',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '.2em',
                cursor: processing ? 'wait' : 'pointer',
                textTransform: 'uppercase',
                boxShadow: '0 4px 14px rgba(113, 28, 50, .25)',
              }}
            >
              {processing ? 'GUARDANDO…' : 'APLICAR ESTE ENCUADRE ✓'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
