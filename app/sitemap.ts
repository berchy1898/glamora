import type { MetadataRoute } from 'next';
import { getArticles } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
    'https://glamora.com.bo';

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/social',
    '/ediciones',
    '/publicidad',
    '/contacto',
    '/categoria/moda',
    '/categoria/belleza',
    '/categoria/people',
    '/categoria/viajes',
    '/categoria/cultura',
    '/categoria/gastronomia',
    '/categoria/mundo',
    '/ciudad/cochabamba',
    '/ciudad/la-paz',
    '/ciudad/oruro',
    '/ciudad/potosi',
    '/ciudad/santa-cruz',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  const articles = await getArticles({ limit: 100, demoFallback: false });
  const articleRoutes: MetadataRoute.Sitemap = articles.map((art) => ({
    url: `${baseUrl}/articulo/${art.slug}`,
    lastModified: art.published_at ? new Date(art.published_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  let issueRoutes: MetadataRoute.Sitemap = [];
  try {
    const db = await supabaseServer();
    if (db) {
      const { data: issues } = await db
        .from('magazine_issues')
        .select('slug,published_at')
        .eq('status', 'published');
      issueRoutes = (issues || []).map((iss: any) => ({
        url: `${baseUrl}/ediciones/${iss.slug}`,
        lastModified: iss.published_at ? new Date(iss.published_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.85,
      }));
    }
  } catch {
    // ignore
  }

  return [...staticRoutes, ...issueRoutes, ...articleRoutes];
}
