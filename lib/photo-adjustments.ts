import type { PhotoEditorialFilter } from './issue-design-types';

export type PhotoAdjustments = {
  brightness?: number; // -50 a +50 (0 = normal)
  contrast?: number;   // -50 a +50 (0 = normal)
  saturation?: number; // -100 a +100 (0 = normal, -100 = B&W)
  warmth?: number;     // -50 a +50 (0 = normal, >0 cálido, <0 frío)
  sepia?: number;      // 0 a 100
  grain?: number;      // 0 a 100 (textura analógica 35mm)
  vignette?: number;   // 0 a 100 (viñeteado de bordes)
};

export type PresetDefinition = {
  id: PhotoEditorialFilter;
  label: string;
  badge: string;
  desc: string;
  adjustments: PhotoAdjustments;
};

export const PHOTO_PRESETS: Record<PhotoEditorialFilter, PresetDefinition> = {
  'natural': {
    id: 'natural',
    label: 'Natural (Sin Retoque)',
    badge: 'RAW / ORIGINAL',
    desc: 'Luz y fidelidad cromática original de la toma.',
    adjustments: { brightness: 0, contrast: 0, saturation: 0, warmth: 0, sepia: 0, grain: 0, vignette: 0 },
  },
  'warm-gold': {
    id: 'warm-gold',
    label: 'Champagne Glow',
    badge: 'ALTA COSTURA',
    desc: 'Calidez solar de pasarela, pieles luminosas y matices dorados.',
    adjustments: { brightness: 4, contrast: 8, saturation: 15, warmth: 26, sepia: 14, grain: 12, vignette: 16 },
  },
  'black-and-white': {
    id: 'black-and-white',
    label: 'Didone Noir (B&W)',
    badge: 'AUTOR CLÁSICO',
    desc: 'Monocromo de alto contraste inspirado en Helmut Newton y Peter Lindbergh.',
    adjustments: { brightness: 2, contrast: 26, saturation: -100, warmth: 0, sepia: 0, grain: 20, vignette: 24 },
  },
  'cinema-contrast': {
    id: 'cinema-contrast',
    label: 'Vogue Paris Drama',
    badge: 'CINEMATOGRÁFICO',
    desc: 'Contraste profundo, sombras esculpidas y negros suntuosos.',
    adjustments: { brightness: -4, contrast: 30, saturation: 14, warmth: 6, sepia: 5, grain: 14, vignette: 32 },
  },
  'vintage-35mm': {
    id: 'vintage-35mm',
    label: 'Portra 400 (Grano 35mm)',
    badge: 'PELÍCULA ANALÓGICA',
    desc: 'Textura nostálgica de rollo analógico, tonos piel suaves y grano fino.',
    adjustments: { brightness: 6, contrast: -4, saturation: -6, warmth: 18, sepia: 10, grain: 42, vignette: 20 },
  },
  'nordic-cool': {
    id: 'nordic-cool',
    label: 'Nordic Mineral',
    badge: 'MODERNO / MINIMAL',
    desc: 'Desaturación selectiva con matices cian glaciales para sastrería pura.',
    adjustments: { brightness: 3, contrast: 14, saturation: -24, warmth: -28, sepia: 0, grain: 10, vignette: 14 },
  },
};

/**
 * Combina un filtro preset y ajustes personalizados en una cadena CSS de `filter`.
 */
export function computePhotoFilterCss(
  presetName: PhotoEditorialFilter = 'natural',
  customAdjustments?: PhotoAdjustments
): string {
  const preset = PHOTO_PRESETS[presetName]?.adjustments || PHOTO_PRESETS.natural.adjustments;
  const adj = { ...preset, ...(customAdjustments || {}) };

  const parts: string[] = [];

  // 1. Brillo
  const brightnessVal = 1 + (adj.brightness || 0) / 100;
  if (brightnessVal !== 1) {
    parts.push(`brightness(${brightnessVal.toFixed(2)})`);
  }

  // 2. Contraste
  const contrastVal = 1 + (adj.contrast || 0) / 100;
  if (contrastVal !== 1) {
    parts.push(`contrast(${contrastVal.toFixed(2)})`);
  }

  // 3. Saturación
  const saturationVal = Math.max(0, 1 + (adj.saturation || 0) / 100);
  if (saturationVal !== 1) {
    parts.push(`saturate(${saturationVal.toFixed(2)})`);
  }

  // 4. Sepia / Calidez
  const sepiaVal = Math.max(0, Math.min(100, (adj.sepia || 0) + Math.max(0, (adj.warmth || 0) * 0.4)));
  if (sepiaVal > 0) {
    parts.push(`sepia(${(sepiaVal / 100).toFixed(2)})`);
  }

  // 5. Tonalidad (Hue Rotate para calidez o frialdad)
  const warmth = adj.warmth || 0;
  if (warmth !== 0) {
    // Si es cálido rotamos hacia el rojo/dorado (-grados), si es frío rotamos hacia el cian/azul (+grados)
    const deg = warmth > 0 ? -Math.round(warmth * 0.25) : Math.round(Math.abs(warmth) * 0.45);
    parts.push(`hue-rotate(${deg}deg)`);
  }

  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Genera el estilo de viñeteado (oscurecimiento gradual radial de bordes)
 */
export function computeVignetteStyle(vignetteLevel?: number): React.CSSProperties | null {
  if (!vignetteLevel || vignetteLevel <= 0) return null;
  const opacity = Math.min(0.85, (vignetteLevel / 100) * 0.75);
  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 2,
    background: `radial-gradient(ellipse at center, transparent 48%, rgba(12, 9, 14, ${opacity.toFixed(2)}) 100%)`,
  };
}

/**
 * Textura SVG de grano fotográfico 35mm generada proceduralmente
 */
export function computeGrainStyle(grainLevel?: number): React.CSSProperties | null {
  if (!grainLevel || grainLevel <= 0) return null;
  const opacity = Math.min(0.45, (grainLevel / 100) * 0.35);
  // SVG con feTurbulence para generar auténtico ruido Gaussiano de emulsión fotográfica
  const svgGrain = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#noiseFilter)" opacity="1"/></svg>`;
  const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svgGrain)}`;

  return {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 3,
    backgroundImage: `url("${encoded}")`,
    opacity: Number(opacity.toFixed(2)),
    mixBlendMode: 'overlay',
  };
}
