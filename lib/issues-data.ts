import { supabasePublic } from './supabase';

export type MagazineIssue = {
  id: string;
  issue_number: number;
  title: string;
  slug: string;
  description?: string | null;
  cover_image?: string | null;
  cover_story_id?: string | null;
  article_ids?: string[] | null;
  status?: string;
  published_at?: string | null;
  created_at?: string | null;
  fascicles?: string[];
  theme?: string;
};

export const DEMO_MAGAZINE_ISSUES: MagazineIssue[] = [
  {
    id: 'issue-01-lino',
    issue_number: 1,
    title: 'El Arte del Lino y la Sastrería de Autor',
    slug: 'edicion-01',
    description:
      'Una edición de colección dedicada a la confección botánica, la vida nocturna en la Llajta, perfiles de creadores bolivianos y coctelería de autor.',
    cover_image: null,
    published_at: '2026-03-01T12:00:00Z',
    created_at: '2026-03-01T12:00:00Z',
    status: 'published',
    theme: 'Sastrería & Galas de Altura',
    fascicles: ['Moda & Atelier', 'Sociedad & Galas', 'Diálogos & Voces', 'Gourmet & Lifestyle'],
  },
];

export async function getPublishedIssues(): Promise<MagazineIssue[]> {
  try {
    const db = supabasePublic();
    if (!db) return DEMO_MAGAZINE_ISSUES;

    const { data, error } = await db
      .from('magazine_issues')
      .select('*')
      .eq('status', 'published')
      .order('issue_number', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEMO_MAGAZINE_ISSUES;
    }

    return data as MagazineIssue[];
  } catch (err) {
    if ((err as any)?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    console.error('[GLAMORA] Error al consultar magazine_issues:', err);
    return DEMO_MAGAZINE_ISSUES;
  }
}

export async function getLatestPublishedIssue(): Promise<MagazineIssue | null> {
  const issues = await getPublishedIssues();
  return issues[0] || null;
}

export async function getIssueBySlug(slug: string): Promise<MagazineIssue | null> {
  try {
    const db = supabasePublic();
    if (!db) {
      return DEMO_MAGAZINE_ISSUES.find((i) => i.slug === slug) || null;
    }

    const { data, error } = await db
      .from('magazine_issues')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !data) {
      return DEMO_MAGAZINE_ISSUES.find((i) => i.slug === slug) || null;
    }

    return data as MagazineIssue;
  } catch (err) {
    if ((err as any)?.digest === 'DYNAMIC_SERVER_USAGE') {
      throw err;
    }
    return DEMO_MAGAZINE_ISSUES.find((i) => i.slug === slug) || null;
  }
}
