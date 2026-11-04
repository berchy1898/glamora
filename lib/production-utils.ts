export type ProductionStage =
  | 'planned'
  | 'confirmed'
  | 'completed'
  | 'production'
  | 'draft'
  | 'review'
  | 'scheduled'
  | 'published'
  | 'attention';

export type ProductionCoverage = {
  status: string;
  linked_article_slug: string | null;
};

export type ProductionArticle = {
  slug: string;
  editorial_status: string | null;
  is_published: boolean;
  published_at: string | null;
};

export function findLinkedArticle<T extends ProductionArticle>(
  coverage: ProductionCoverage,
  articlesBySlug: ReadonlyMap<string, T>,
): T | null {
  if (!coverage.linked_article_slug) return null;
  return articlesBySlug.get(coverage.linked_article_slug) || null;
}

export function resolveProductionStage(
  coverage: ProductionCoverage,
  article: ProductionArticle | null,
  now = new Date(),
): ProductionStage {
  if (coverage.linked_article_slug && !article) return 'attention';

  if (article) {
    const editorialStatus = article.editorial_status;

    // El estado editorial publicado es suficiente, incluso si falta published_at.
    if (editorialStatus === 'published') return 'published';
    if (editorialStatus === 'scheduled') return 'scheduled';

    if (article.is_published) {
      const publishedAt = article.published_at ? Date.parse(article.published_at) : Number.NaN;
      return Number.isFinite(publishedAt) && publishedAt > now.getTime()
        ? 'scheduled'
        : 'published';
    }

    if (editorialStatus === 'review' || editorialStatus === 'approved') return 'review';
    if (editorialStatus === 'draft') return 'draft';
    if (editorialStatus) return 'attention';
  }

  switch (coverage.status) {
    case 'pending': return 'planned';
    case 'confirmed': return 'confirmed';
    case 'completed': return 'completed';
    case 'preparing': return 'production';
    case 'article_created': return article ? 'production' : 'attention';
    case 'in_review': return 'review';
    case 'published': return 'published';
    default: return 'attention';
  }
}
