'use client';

import React, { useEffect, useState } from 'react';

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'x'
  | 'whatsapp'
  | 'messenger';

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
    id: 'x',
    shortLabel: 'X',
    name: 'X',
    href: process.env.NEXT_PUBLIC_SOCIAL_X || 'https://x.com/',
  },
  {
    id: 'whatsapp',
    shortLabel: 'WP',
    name: 'WhatsApp',
    href: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP || 'https://wa.me/',
  },
  {
    id: 'messenger',
    shortLabel: 'MSG',
    name: 'Messenger',
    href: process.env.NEXT_PUBLIC_SOCIAL_MESSENGER || 'https://www.messenger.com/',
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
    case 'x':
      return (
        <svg {...common}>
          <path d="M4 4l16 16M20 4L4 20" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg {...common}>
          <path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 20.5 11.8z" />
          <path d="M9.4 8.8c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.2.1.4 0 .6l-.5.6c-.1.2-.2.3 0 .6.3.5.9 1.2 1.8 1.7.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.4.5 0 .4-.2 1.1-.7 1.5-.5.4-1.2.5-2 .2-1.8-.6-3.4-1.9-4.4-3.6-.6-1-.7-1.9-.3-2.5z" />
        </svg>
      );
    case 'messenger':
      return (
        <svg {...common}>
          <path d="M12 3c-5 0-9 3.7-9 8.4 0 2.6 1.3 4.9 3.3 6.4V21l3-1.7c.9.2 1.8.4 2.7.4 5 0 9-3.7 9-8.4S17 3 12 3z" />
          <path d="M7.5 13.2l3-3.2 2.2 2.2 3.8-3.2" />
        </svg>
      );
  }
}
