'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function HeroCoverImage({
  slug,
  src,
  alt,
  city,
  initialAspect = 'landscape',
}: {
  slug: string;
  src: string;
  alt: string;
  city?: string | null;
  initialAspect?: 'landscape' | 'portrait' | 'square';
}) {
  const [aspect, setAspect] = useState<'landscape' | 'portrait' | 'square'>(initialAspect);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (initialAspect) {
      setAspect(initialAspect);
    }
  }, [initialAspect]);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio >= 1.18) {
        setAspect('landscape');
      } else if (ratio <= 0.92) {
        setAspect('portrait');
      } else {
        setAspect('square');
      }
    }
    setIsLoaded(true);
  }

  return (
    <Link
      href={`/articulo/${slug}`}
      className={`hero-image hero-image-${aspect} ${isLoaded ? 'is-ready' : ''}`}
      style={{
        width: '100%',
        display: 'block',
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="eager"
        onLoad={handleImageLoad}
        className="hero-adaptive-img"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      <span className="image-credit">
        {city || 'GLAMORA EDITORIAL'}
      </span>
    </Link>
  );
}
