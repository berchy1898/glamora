'use client';

import React, { useEffect, useState } from 'react';

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'whatsapp'
  | 'linkedin';

export type GlamoraSocialChannel = {
  id: SocialPlatform;
  shortLabel: string;
  name: string;
  href: string;
};

export const GLAMORA_SOCIAL_CHANNELS: GlamoraSocialChannel[] = [
  {
    id: 'instagram',
    shortLabel: 'IG',
    name: 'Instagram',
    href: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://www.instagram.com/',
  },
  {
    id: 'facebook',
    shortLabel: 'FB',
    name: 'Facebook',
    href: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || 'https://www.facebook.com/',
  },
  {
    id: 'tiktok',
    shortLabel: 'TIKTOK',
    name: 'TikTok',
    href: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || 'https://www.tiktok.com/',
  },
  {
    id: 'whatsapp',
    shortLabel: 'WP',
    name: 'WhatsApp',
    href: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP || 'https://wa.me/',
  },
  {
    id: 'linkedin',
    shortLabel: 'IN',
    name: 'LinkedIn',
    href: process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || 'https://www.linkedin.com/',
  },
];

export function useGlamoraSocialChannels(): GlamoraSocialChannel[] {
  const [channels, setChannels] = useState<GlamoraSocialChannel[]>(GLAMORA_SOCIAL_CHANNELS);

  useEffect(() => {
    let active = true;
    fetch('/api/studio-config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.socials) return;
        setChannels(
          GLAMORA_SOCIAL_CHANNELS.map((ch) => ({
            ...ch,
            href: data.socials[ch.id] || ch.href,
          }))
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return channels;
}

export function SocialIcon({
  platform,
  size = 13,
}: {
  platform: SocialPlatform;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  switch (platform) {
    case 'instagram':
      return (
        <svg {...common}>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
          <circle cx="12" cy="12" r="4.2" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'facebook':
      return (
        <svg {...common}>
          <path d="M15 3h-3a4 4 0 0 0-4 4v3H5v3.5h3V21h3.6v-7.5H15L15.6 10h-4V7.3c0-.8.3-1.3 1.3-1.3H15V3z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg {...common}>
          <path d="M9 12a4 4 0 1 0 4 4V4c.7 2.5 2.6 4.2 5 4.5" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...common}>
          <path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 20.5 11.8z" />
          <path d="M9.4 8.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .6l-.5.6c-.1.2-.2.3 0 .6.3.5.9 1.2 1.8 1.7.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.4.5 0 .4-.2 1.1-.7 1.5-.5.4-1.2.5-2 .2-1.8-.6-3.4-1.9-4.4-3.6-.6-1-.7-1.9-.3-2.5z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg {...common}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
  }
}
