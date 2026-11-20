'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const imgRef = useRef<HTMLImageElement | null>(null);

  const detectAspect = useCallback((img: HTMLImageElement) => {
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
  }, []);

  useEffect(() => {
    if (initialAspect) {
      setAspect(initialAspect);
    }
  }, [initialAspect]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      detectAspect(imgRef.current);
    }
  }, [src, detectAspect]);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    detectAspect(e.currentTarget);
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
        ref={imgRef}
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
