'use client';

import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

export type EditorialGalleryPhoto = {
  src: string;
  alt: string;
  caption: string;
  overline?: string;
  people?: string;
};

type EditorialGalleryProps = {
  photos: EditorialGalleryPhoto[];
  variant?: 'article' | 'social';
};

export function EditorialGallery({
  photos,
  variant = 'article',
}: EditorialGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null;
      return (current - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const next = useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null;
      return (current + 1) % photos.length;
    });
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, close, prev, next]);

  if (photos.length === 0) return null;

  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;
  const totalFormatted = String(photos.length).padStart(2, '0');

  return (
    <>
      <div className={`moment-gallery moment-gallery-editorial moment-gallery-${variant}`}>
        {photos.map((item, i) => {
          const indexFormatted = String(i + 1).padStart(2, '0');
          const rhythmClass =
            i % 5 === 0
              ? 'moment-rhythm-feature'
              : i % 5 === 1
                ? 'moment-rhythm-offset-down'
                : i % 5 === 2
                  ? 'moment-rhythm-portrait-card'
                  : i % 5 === 3
                    ? 'moment-rhythm-offset-up'
                    : 'moment-rhythm-wide';

          return (
            <figure
              className={`moment moment-${(i % 4) + 1} ${rhythmClass} moment-interactive`}
              key={`${item.src}-${i}`}
            >
              <button
                type="button"
                className="moment-trigger"
                onClick={() => setActiveIndex(i)}
                aria-label={`Ampliar ${item.alt}`}
              >
                <div className="moment-image-frame">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    unoptimized={item.src.startsWith('http')}
                    sizes="(max-width: 700px) 100vw, 50vw"
                  />
                  <span className="moment-zoom-badge" aria-hidden="true">
                    AMPLIAR ↗
                  </span>
                </div>
              </button>

              {(item.caption || item.people || item.overline) && (
                <figcaption className="moment-editorial-caption">
                  {item.overline && (
                    <span className="moment-caption-kicker">
                      {item.overline}
                    </span>
                  )}
                  {item.caption && <p className="moment-caption-text">{item.caption}</p>}
                  {item.people && (
                    <span className="moment-caption-people">
                      En el encuadre: <em>{item.people}</em>
                    </span>
                  )}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>

      {activePhoto && activeIndex !== null && (
        <div
          className="editorial-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Visor de galería fotográfica"
          onClick={close}
        >
          <div
            className="editorial-lightbox-topbar"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="editorial-lightbox-brand">
              GLAMORA · PHOTO DIARY
            </span>
            <span className="editorial-lightbox-counter">
              {String(activeIndex + 1).padStart(2, '0')} / {totalFormatted}
            </span>
            <button
              type="button"
              className="editorial-lightbox-close"
              onClick={close}
              aria-label="Cerrar galería"
            >
              CERRAR ✕
            </button>
          </div>

          <div
            className="editorial-lightbox-stage"
            onClick={(e) => e.stopPropagation()}
          >
            {photos.length > 1 && (
              <button
                type="button"
                className="editorial-lightbox-nav editorial-lightbox-prev"
                onClick={prev}
                aria-label="Fotografía anterior"
              >
                ←
              </button>
            )}

            <div className="editorial-lightbox-figure">
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
                fill
                unoptimized={activePhoto.src.startsWith('http')}
                sizes="95vw"
                priority
              />
            </div>

            {photos.length > 1 && (
              <button
                type="button"
                className="editorial-lightbox-nav editorial-lightbox-next"
                onClick={next}
                aria-label="Fotografía siguiente"
              >
                →
              </button>
            )}
          </div>

          <div
            className="editorial-lightbox-footer"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{String(activeIndex + 1).padStart(2, '0')} / {totalFormatted}</span>
            <div className="editorial-lightbox-caption-wrap">
              {activePhoto.caption && <p>{activePhoto.caption}</p>}
              {activePhoto.people && (
                <small>En el encuadre: {activePhoto.people}</small>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
