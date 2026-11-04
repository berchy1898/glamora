export type CoverageDraftArticle = {
  slug: string;
  event_name: string | null;
  event_date: string | null;
  is_published: boolean;
};

export type CoverageDraftPayload = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  city: string;
  cover_image: null;
  author: string;
  is_published: false;
  editorial_status: 'draft';
  is_social: true;
  event_name: string;
  venue: string | null;
  event_date: string | null;
  gallery_images: string[];
  people_tags: string[];
  published_at: null;
};

export type CoverageDraftRepository = {
  findBySlug(slug: string): Promise<{
    data: CoverageDraftArticle | null;
    error: string | null;
  }>;
  findLegacyCandidates(idSuffix: string): Promise<{
    data: CoverageDraftArticle[];
    error: string | null;
  }>;
  createDraft(article: CoverageDraftPayload): Promise<{ error: string | null }>;
  saveCoverageLink(coverageId: string, slug: string): Promise<{ error: string | null }>;
};

export type CoverageDraftLinkStage = 'lookup' | 'create' | 'link';

export class CoverageDraftLinkError extends Error {
  constructor(
    message: string,
    readonly stage: CoverageDraftLinkStage,
    readonly slug?: string,
  ) {
    super(message);
    this.name = 'CoverageDraftLinkError';
  }
}

export function getCoverageDraftSlug(coverageId: string): string {
  const stableId = coverageId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (!stableId) throw new Error('La cobertura no tiene un identificador válido.');
  return `cobertura-${stableId}`;
}

export async function ensureCoverageDraftLink(input: {
  coverageId: string;
  title: string;
  eventDate: string;
  category: string;
  city: string;
  venue: string;
}, repository: CoverageDraftRepository): Promise<{ slug: string; created: boolean; recovered: boolean }> {
  const slug = getCoverageDraftSlug(input.coverageId);
  const idSuffix = input.coverageId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase();

  const current = await repository.findBySlug(slug);
  if (current.error) throw new CoverageDraftLinkError(current.error, 'lookup', slug);

  let article = current.data;
  let recovered = false;

  if (!article) {
    // Recupera borradores creados por la versión anterior, cuyo slug dependía
    // del título y la fecha. Si los datos cambiaron, no crea otro artículo a ciegas.
    const legacy = await repository.findLegacyCandidates(idSuffix);
    if (legacy.error) throw new CoverageDraftLinkError(legacy.error, 'lookup', slug);

    const candidates = legacy.data || [];
    const compatible = candidates.filter((candidate) =>
      !candidate.is_published &&
      (candidate.event_date === input.eventDate || candidate.event_name === input.title),
    );

    if (compatible.length > 1) {
      throw new CoverageDraftLinkError(
        'Hay más de un borrador heredado posible. No se creó otro artículo para evitar duplicados; revisa la cobertura y vincula el artículo correcto manualmente.',
        'lookup',
      );
    }

    if (compatible.length === 1) {
      article = compatible[0];
      recovered = true;
    } else if (candidates.length > 0) {
      throw new CoverageDraftLinkError(
        'Se encontró un borrador anterior que no coincide con los datos actuales. No se creó otro artículo; revisa la cobertura y vincula el artículo correcto manualmente.',
        'lookup',
      );
    }
  }

  let created = false;
  if (!article) {
    const draft: CoverageDraftPayload = {
      title: input.title,
      slug,
      excerpt: '',
      body: '',
      category: input.category,
      city: input.city,
      cover_image: null,
      author: 'GLAMORA EDITORIAL',
      is_published: false,
      editorial_status: 'draft',
      is_social: true,
      event_name: input.title,
      venue: input.venue || null,
      event_date: input.eventDate || null,
      gallery_images: [],
      people_tags: [],
      published_at: null,
    };

    const result = await repository.createDraft(draft);
    if (result.error) throw new CoverageDraftLinkError(result.error, 'create', slug);
    created = true;
  }

  const link = await repository.saveCoverageLink(input.coverageId, article?.slug || slug);
  if (link.error) throw new CoverageDraftLinkError(link.error, 'link', article?.slug || slug);

  return { slug: article?.slug || slug, created, recovered };
}
