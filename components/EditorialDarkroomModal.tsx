'use client';

import { useState } from 'react';
import {
  PHOTO_PRESETS,
  computePhotoFilterCss,
  computeVignetteStyle,
  computeGrainStyle,
  type PhotoAdjustments,
} from '@/lib/photo-adjustments';
import type { PhotoEditorialFilter } from '@/lib/issue-design-types';

type EditorialDarkroomModalProps = {
  isOpen: boolean;
  photoUrl: string;
  articleTitle: string;
  initialFilter?: PhotoEditorialFilter;
  initialAdjustments?: PhotoAdjustments;
  onSave: (filter: PhotoEditorialFilter, adjustments: PhotoAdjustments) => void;
  onClose: () => void;
};

export function EditorialDarkroomModal({
  isOpen,
  photoUrl,
  articleTitle,
  initialFilter = 'natural',
  initialAdjustments = {},
  onSave,
  onClose,
}: EditorialDarkroomModalProps) {
  const [activePreset, setActivePreset] = useState<PhotoEditorialFilter>(initialFilter);
  const [adjustments, setAdjustments] = useState<PhotoAdjustments>({
    ...PHOTO_PRESETS[initialFilter]?.adjustments,
    ...initialAdjustments,
  });
  const [showOriginal, setShowOriginal] = useState(false);

  if (!isOpen) return null;

  function handleSelectPreset(presetKey: PhotoEditorialFilter) {
    setActivePreset(presetKey);
    setAdjustments({
      ...PHOTO_PRESETS[presetKey].adjustments,
    });
  }

  function handleSliderChange(field: keyof PhotoAdjustments, value: number) {
    setAdjustments((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleReset() {
    setActivePreset('natural');
    setAdjustments({ ...PHOTO_PRESETS.natural.adjustments });
  }

  function handleConfirm() {
    onSave(activePreset, adjustments);
    onClose();
  }

  const effectiveFilter = showOriginal
    ? 'none'
    : computePhotoFilterCss(activePreset, adjustments);
  const effectiveVignette = showOriginal
    ? null
    : computeVignetteStyle(adjustments.vignette);
  const effectiveGrain = showOriginal
    ? null
    : computeGrainStyle(adjustments.grain);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(8, 6, 11, 0.92)',
        backdropFilter: 'blur(12px)',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Laboratorio Fotográfico Darkroom"
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          maxHeight: '94vh',
          background: '#151218',
          color: '#f5efe8',
          borderRadius: 4,
          boxShadow: '0 32px 90px rgba(0, 0, 0, 0.85)',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          overflow: 'hidden',
        }}
      >
        {/* Cabecera Darkroom */}
        <header
          style={{
            padding: '14px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#1c1822',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '.22em',
                color: '#dfba73',
                marginBottom: 2,
                textTransform: 'uppercase',
              }}
            >
              GLAMORA STUDIO · LABORATORIO FOTOGRÁFICO Y DARKROOM
            </div>
            <strong
              style={{
                font: '400 17px/1.2 var(--font-editorial, Georgia, serif)',
                color: '#fbf7f2',
              }}
            >
              {articleTitle}
            </strong>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                fontSize: 8.5,
                letterSpacing: '.14em',
                color: '#baa89b',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '3px 8px',
                borderRadius: 2,
              }}
            >
              300 DPI PREVIEW
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '5px 12px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'transparent',
                color: '#dfcfbe',
                fontSize: 9,
                letterSpacing: '.18em',
                cursor: 'pointer',
              }}
            >
              ✕ CERRAR
            </button>
          </div>
        </header>

        {/* Cuerpo del Editor: Visor + Panel de Controles */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) 380px',
            overflow: 'hidden',
          }}
        >
          {/* LADO IZQUIERDO: VISOR DE FOTOGRAFÍA (CANVAS / WYSIWYG) */}
          <div
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0e0b12',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Marco de la Fotografía */}
            <div
              style={{
                position: 'relative',
                maxWidth: '100%',
                maxHeight: 'calc(94vh - 160px)',
                aspectRatio: '3 / 4',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#19151f',
              }}
            >
              <img
                src={photoUrl}
                alt={articleTitle}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: effectiveFilter,
                  transition: 'filter 0.08s ease',
                  display: 'block',
                }}
              />

              {/* Capa de Viñeteado */}
              {effectiveVignette && <div style={effectiveVignette} />}

              {/* Capa de Grano Analógico 35mm */}
              {effectiveGrain && <div style={effectiveGrain} />}

              {/* Badge indicando si se está viendo el original A/B */}
              {showOriginal && (
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    background: '#711c32',
                    color: '#fff',
                    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                    fontSize: 8.5,
                    fontWeight: 700,
                    letterSpacing: '.16em',
                    padding: '3px 8px',
                    borderRadius: 2,
                    zIndex: 10,
                  }}
                >
                  ORIGINAL SIN RETOQUE (A/B)
                </div>
              )}
            </div>

            {/* Botón flotante para presionar y ver original */}
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onMouseDown={() => setShowOriginal(true)}
                onMouseUp={() => setShowOriginal(false)}
                onTouchStart={() => setShowOriginal(true)}
                onTouchEnd={() => setShowOriginal(false)}
                style={{
                  padding: '6px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#e2d7cc',
                  fontSize: 8.5,
                  letterSpacing: '.16em',
                  cursor: 'pointer',
                  userSelect: 'none',
                  borderRadius: 2,
                }}
              >
                👁 MANTÉN PRESIONADO PARA VER ORIGINAL
              </button>
            </div>
          </div>

          {/* LADO DERECHO: PANEL DE REVELADO EDITORIAL */}
          <div
            style={{
              padding: '20px 22px',
              borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#191520',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {/* SECCIÓN 1: PRESETS DE ALTA COSTURA */}
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '.2em',
                  color: '#dfba73',
                  marginBottom: 10,
                  textTransform: 'uppercase',
                }}
              >
                1. PRESETS DE REVELADO (PASARELA & EDITORIAL)
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                {(Object.keys(PHOTO_PRESETS) as PhotoEditorialFilter[]).map((key) => {
                  const p = PHOTO_PRESETS[key];
                  const isSelected = activePreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPreset(key)}
                      style={{
                        padding: '10px 10px',
                        textAlign: 'left',
                        background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        border: isSelected ? '1px solid #dfba73' : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#dfba73' : '#e8e0d5',
                        cursor: 'pointer',
                        borderRadius: 2,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontSize: 7.5,
                          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
                          letterSpacing: '.14em',
                          opacity: 0.75,
                          marginBottom: 2,
                        }}
                      >
                        {p.badge}
                      </span>
                      <strong style={{ display: 'block', fontSize: 11, fontWeight: 600 }}>
                        {p.label}
                      </strong>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECCIÓN 2: AJUSTES TONALES FINOS */}
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '.2em',
                  color: '#dfba73',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                }}
              >
                2. CURVA TONAL & EXPOSICIÓN
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Exposición / Brillo */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#d9cec2' }}>
                    <span>Brillo / Exposición</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {(adjustments.brightness || 0) > 0 ? `+${adjustments.brightness}` : adjustments.brightness || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={adjustments.brightness || 0}
                    onChange={(e) => handleSliderChange('brightness', Number(e.target.value))}
                    style={{ accentColor: '#dfba73', cursor: 'pointer' }}
                  />
                </label>

                {/* Contraste Editorial */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#d9cec2' }}>
                    <span>Contraste Editorial</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {(adjustments.contrast || 0) > 0 ? `+${adjustments.contrast}` : adjustments.contrast || 0}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={adjustments.contrast || 0}
                    onChange={(e) => handleSliderChange('contrast', Number(e.target.value))}
                    style={{ accentColor: '#dfba73', cursor: 'pointer' }}
                  />
                </label>

                {/* Saturación Cromática */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#d9cec2' }}>
                    <span>Saturación de Color</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {(adjustments.saturation || 0) > 0 ? `+${adjustments.saturation}` : adjustments.saturation || 0}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={adjustments.saturation || 0}
                    onChange={(e) => handleSliderChange('saturation', Number(e.target.value))}
                    style={{ accentColor: '#dfba73', cursor: 'pointer' }}
                  />
                </label>

                {/* Temperatura / Calidez */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#d9cec2' }}>
                    <span>Temperatura (Cálido / Frío)</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {(adjustments.warmth || 0) > 0 ? `+${adjustments.warmth} (Oro)` : (adjustments.warmth || 0) < 0 ? `${adjustments.warmth} (Cian)` : '0'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    value={adjustments.warmth || 0}
                    onChange={(e) => handleSliderChange('warmth', Number(e.target.value))}
                    style={{ accentColor: '#dfba73', cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>

            {/* SECCIÓN 3: TEXTURA & PRENSA FÍSICA */}
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '.2em',
                  color: '#dfba73',
                  marginBottom: 12,
                  textTransform: 'uppercase',
                }}
              >
                3. EMULSIÓN & TEXTURA DE PRENSA
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Grano Analógico 35mm */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#d9cec2' }}>
                    <span>Grano Analógico 35mm</span>
                    <span style={{ fontFamily: 'monospace' }}>{adjustments.grain || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={adjustments.grain || 0}
                    onChange={(e) => handleSliderChange('grain', Number(e.target.value))}
                    style={{ accentColor: '#dfba73', cursor: 'pointer' }}
                  />
                </label>

                {/* Viñeteado de Lujo */}
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#d9cec2' }}>
                    <span>Viñeteado Editorial</span>
                    <span style={{ fontFamily: 'monospace' }}>{adjustments.vignette || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={adjustments.vignette || 0}
                    onChange={(e) => handleSliderChange('vignette', Number(e.target.value))}
                    style={{ accentColor: '#dfba73', cursor: 'pointer' }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Inferior con Acciones de Guardado */}
        <footer
          style={{
            padding: '12px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#191520',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'transparent',
              color: '#baa89b',
              fontSize: 9,
              letterSpacing: '.14em',
              cursor: 'pointer',
            }}
          >
            ↺ RESTABLECER ORIGINAL
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'transparent',
                color: '#d9cec2',
                fontSize: 9,
                letterSpacing: '.14em',
                cursor: 'pointer',
              }}
            >
              CANCELAR
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              style={{
                padding: '9px 20px',
                border: '1px solid #711c32',
                background: '#711c32',
                color: '#fff',
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: '.16em',
                cursor: 'pointer',
                borderRadius: 2,
              }}
            >
              ✓ APLICAR REVELADO AL PLIEGO
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
