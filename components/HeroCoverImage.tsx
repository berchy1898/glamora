'use client';

import { useState } from 'react';
import Link from 'next/link';

export function HeroCoverImage({
  slug,
  src,
  alt,
  city,
}: {
  slug: string;
  src: string;
  alt: string;
  city?: string | null;
}) {
  const [aspect, setAspect] = useState<'landscape' | 'portrait' | 'square'>('landscape');
  const [isLoaded, setIsLoaded] = useState(false);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio >= 1.25) {
        setAspect('landscape');
      } else if (ratio <= 0.88) {
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
    >
      <img
        src={src}
        alt={alt}
        loading="eager"
        onLoad={handleImageLoad}
        className="hero-adaptive-img"
      />
      <span className="image-credit">
        {city || 'GLAMORA EDITORIAL'}
      </span>
    </Link>
  );
}
