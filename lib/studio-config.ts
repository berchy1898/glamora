import fs from 'fs/promises';
import path from 'path';
import type { SocialPlatform } from '@/components/SocialIcons';
import {
  DEFAULT_ISSUE_DESIGN,
  type CoverMastheadPalette,
  type IssueDesignConfig,
  type SpreadLayoutStyle,
  type PhotoEditorialFilter,
  type PhotoFocalPoint,
  type FascicleKind,
  type FashionWishlistItem,
  type ArticleSponsorTag,
  type MastheadStaffConfig,
} from '@/lib/issue-design-types';

export {
  DEFAULT_ISSUE_DESIGN,
  type CoverMastheadPalette,
  type IssueDesignConfig,
  type SpreadLayoutStyle,
  type PhotoEditorialFilter,
  type PhotoFocalPoint,
  type FascicleKind,
  type FashionWishlistItem,
  type ArticleSponsorTag,
  type MastheadStaffConfig,
};

export type StudioSocialLinks = Record<SocialPlatform, string>;

export type NewsletterSubscriber = {
  email: string;
  subscribedAt: string;
};

export type ContactMessageItem = {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
  tipo: string;
  mensaje: string;
  createdAt: string;
};

export type StudioConfigData = {
  socials: StudioSocialLinks;
  subscribers: NewsletterSubscriber[];
  issueDesigns: Record<string, IssueDesignConfig>;
  contactMessages: ContactMessageItem[];
  articleViews: Record<string, number>;
};

export const DEFAULT_SOCIAL_LINKS: StudioSocialLinks = {
  instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://www.instagram.com/',
  facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || 'https://www.facebook.com/',
  tiktok: process.env.NEXT_PUBLIC_SOCIAL_TIKTOK || 'https://www.tiktok.com/',
  x: process.env.NEXT_PUBLIC_SOCIAL_X || 'https://x.com/',
  whatsapp: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP || 'https://wa.me/',
  messenger: process.env.NEXT_PUBLIC_SOCIAL_MESSENGER || 'https://www.messenger.com/',
};

const CONFIG_PATH = path.join(process.cwd(), 'data', 'studio-config.json');

async function getSupabaseRest(endpoint: string): Promise<any> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(`${url}/rest/v1/${endpoint}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function postSupabaseRest(endpoint: string, body: any, upsert = false): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const headers: Record<string, string> = {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: upsert ? 'resolution=merge-duplicates' : 'return=minimal',
    };
    const res = await fetch(`${url}/rest/v1/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function readStudioConfig(): Promise<StudioConfigData> {
  // 1. Intentar leer desde Supabase
  let cloudSocials: Partial<StudioSocialLinks> | null = null;
  let cloudIssueDesigns: Record<string, IssueDesignConfig> | null = null;
  let cloudViews: Record<string, number> | null = null;
  let cloudSubs: NewsletterSubscriber[] | null = null;
  let cloudContacts: ContactMessageItem[] | null = null;

  try {
    const settings = await getSupabaseRest('studio_settings?select=key,value');
    if (Array.isArray(settings)) {
      for (const row of settings) {
        if (row.key === 'social_links' && row.value) cloudSocials = row.value;
        if (row.key === 'issue_designs' && row.value) cloudIssueDesigns = row.value;
        if (row.key === 'article_views' && row.value) cloudViews = row.value;
      }
    }

    const subs = await getSupabaseRest('newsletter_subscribers?select=email,subscribed_at&order=subscribed_at.desc');
    if (Array.isArray(subs)) {
      cloudSubs = subs.map((s: any) => ({ email: s.email, subscribedAt: s.subscribed_at }));
    }

    const leads = await getSupabaseRest('contact_leads?select=id,name,company,email,inquiry_type,message,created_at&order=created_at.desc');
    if (Array.isArray(leads)) {
      cloudContacts = leads.map((l: any) => ({
        id: l.id,
        nombre: l.name,
        empresa: l.company || '',
        email: l.email,
        tipo: l.inquiry_type || 'General',
        mensaje: l.message,
        createdAt: l.created_at,
      }));
    }
  } catch {
    // Si falla la nube, continúa al respaldo local
  }

  // 2. Leer archivo local de respaldo
  let fileData: Partial<StudioConfigData> = {};
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    fileData = JSON.parse(raw);
  } catch {
    // ignore
  }

  return {
    socials: {
      ...DEFAULT_SOCIAL_LINKS,
      ...(fileData.socials || {}),
      ...(cloudSocials || {}),
    },
    subscribers: cloudSubs !== null ? cloudSubs : (Array.isArray(fileData.subscribers) ? fileData.subscribers : []),
    issueDesigns: cloudIssueDesigns !== null ? cloudIssueDesigns : (fileData.issueDesigns || {}),
    contactMessages: cloudContacts !== null ? cloudContacts : (Array.isArray(fileData.contactMessages) ? fileData.contactMessages : []),
    articleViews: cloudViews !== null ? cloudViews : (fileData.articleViews || {}),
  };
}

export async function writeStudioConfig(data: StudioConfigData): Promise<void> {
  // 1. Escribir a Supabase en paralelo
  try {
    await postSupabaseRest('studio_settings', [
      { key: 'social_links', value: data.socials, updated_at: new Date().toISOString() },
      { key: 'issue_designs', value: data.issueDesigns, updated_at: new Date().toISOString() },
      { key: 'article_views', value: data.articleViews, updated_at: new Date().toISOString() },
    ], true);
  } catch {
    // ignore
  }

  // 2. Escribir copia de seguridad local (si el entorno lo permite)
  try {
    const dir = path.dirname(CONFIG_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Ignorar en entornos de solo lectura (serverless / cloudflare edge)
  }
}
