'use client';

import { useState } from 'react';
import Link from 'next/link';

export type SocialTileItem = {
  key: string;
  href: string;
  title: string;
  city: string;
  tag: string;
  image: string;
  alt: string;
  cta: string;
};

export function SocialAdaptiveTile({
  item,
  index,
}: {
  item: SocialTileItem;
  index: number;
}) {
  const [aspect, setAspect] = useState<'landscape' | 'portrait' | 'square'>('portrait');
  const [isLoaded, setIsLoaded] = useState(false);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio >= 1.2) {
        setAspect('landscape');
      } else if (ratio <= 0.88) {
        setAspect('portrait');
      } else {
        setAspect('square');
      }
    }
    setIsLoaded(true);
  }

  const indexFormatted = String(index + 1).padStart(2, '0');

  return (
    <Link
      href={item.href}
      className={`social-tile social-tile-${aspect} social-tile-pos-${index + 1}`}
    >
      <div className={`social-image social-image-${aspect} ${isLoaded ? 'is-ready' : ''}`}>
        <img
          src={item.image}
          alt={item.alt}
          loading="lazy"
          onLoad={handleImageLoad}
          className="social-adaptive-img"
        />
        <span className="social-index">
          {indexFormatted}
        </span>
      </div>

      <div className="social-caption">
        <span>
          {item.city} <i>·</i> {item.tag}
        </span>
        <h3>{item.title}</h3>
        <b>{item.cta}</b>
      </div>
    </Link>
  );
}
