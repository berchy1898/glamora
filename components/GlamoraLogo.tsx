'use client';

type GlamoraLogoProps = {
  variant?: 'header' | 'footer' | 'login' | 'compact';
  tone?: 'dark-bg' | 'light-bg';
  subtitle?: string;
  className?: string;
};

/**
 * Emblema tipográfico vectorial UHD de GLAMORA.
 * Se renderiza con nitidez infinita (4K/Retina/UHD) usando Cormorant Garamond + vector puro,
 * sin píxeles borrosos ni degradados de mapa de bits.
 */
export function GlamoraLogo({
  variant = 'header',
  tone = 'dark-bg',
  subtitle = 'ESTILO · CULTURA · SOCIEDAD',
  className = '',
}: GlamoraLogoProps) {
  return (
    <span
      className={`glamora-vector-logo glamora-vector-logo-${variant} glamora-vector-logo-${tone} ${className}`.trim()}
      aria-label="GLAMORA · Estilo, Cultura, Sociedad"
    >
      <span className="glamora-vector-monogram" aria-hidden="true">
        G
      </span>
      <span className="glamora-vector-wordmark">GLAMORA</span>
      {subtitle && (
        <span className="glamora-vector-subtitle" aria-hidden="true">
          {subtitle}
        </span>
      )}
    </span>
  );
}
