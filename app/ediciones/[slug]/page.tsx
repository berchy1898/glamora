import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase';
import { ArticleCard } from '@/components/ArticleCard';
import { InteractiveIssueReader } from '@/components/InteractiveIssueReader';
import { DEFAULT_ISSUE_DESIGN, readStudioConfig } from '@/lib/studio-config';
import { buildIssuePaginationPlan } from '@/lib/issue-pagination';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const db = await supabaseServer();

  if (!db) {
    return { title: 'The Digital Issue' };
  }

  const { data: issue } = await db
    .from('magazine_issues')
    .select('issue_number,title,cover_image')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!issue) {
    return { title: 'Edición no encontrada' };
  }

  const issueLabel = `Nº ${String(issue.issue_number).padStart(2, '0')} · ${issue.title}`;
  const description = `The Glamora Digital Issue · ${issueLabel}. Una selección editorial de GLAMORA.`;
  const images = issue.cover_image
    ? [{ url: issue.cover_image, alt: `Portada de ${issue.title} — GLAMORA` }]
    : [{ url: '/brand/glamora-mark.png', alt: 'GLAMORA' }];

  return {
    title: issueLabel,
    description,
    openGraph: {
      title: `${issueLabel} | GLAMORA`,
      description,
      type: 'book',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${issueLabel} | GLAMORA`,
      description,
      images: issue.cover_image ? [issue.cover_image] : ['/brand/glamora-mark.png'],
    },
  };
}

export default async function Issue({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await supabaseServer();

  if (!db) notFound();

  const { data: issue } = await db
    .from('magazine_issues')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (!issue) {
    const { data: redirect } = await db
      .from('magazine_issue_redirects')
      .select('new_slug')
      .eq('old_slug', slug)
      .maybeSingle();

    if (redirect?.new_slug) {
      permanentRedirect(`/ediciones/${redirect.new_slug}`);
    }

    notFound();
  }

  const articleIds: string[] = issue.article_ids || [];

  const { data: rows } = await db
    .from('articles')
    .select('*')
    .in('id', articleIds)
    .eq('is_published', true);

  const { data: sponsorRows } = await db
    .from('sponsors')
    .select('*')
    .eq('active', true)
    .limit(3);

  const byId = new Map(
    (rows || []).map((article: any) => [article.id, article])
  );

  const articles = articleIds
    .map((id: string) => byId.get(id))
    .filter(Boolean) as any[];

  const selectedCoverStory = articles.find(
    article => article.id === issue.cover_story_id
  );
  const featuredArticle = selectedCoverStory || articles[0];
  const secondaryArticles = articles.filter(
    article => article.id !== featuredArticle?.id
  );

  const { data: dbIssueDesignsRow } = await db
    .from('studio_settings')
    .select('value')
    .eq('key', 'issue_designs')
    .maybeSingle();

  const cloudDesigns = dbIssueDesignsRow?.value || {};
  const studioConfig = await readStudioConfig();
  const allDesigns = {
    ...studioConfig.issueDesigns,
    ...cloudDesigns,
  };

  const issueDesign =
    allDesigns[issue.slug] ||
    allDesigns[String(issue.id)] ||
    DEFAULT_ISSUE_DESIGN;

  const paginationPlan = buildIssuePaginationPlan(articles, issueDesign);

  return (
    <main className="issue-page">
      <div className="issue-container">
        <header className="issue-header">
          <div className="issue-kicker">
            THE GLAMORA DIGITAL ISSUE · Nº {issue.issue_number}
          </div>
          <h1>{issue.title}</h1>
          <p>Toca la portada o el sumario para hojear la edición digital completa página por página.</p>
        </header>

        <InteractiveIssueReader
          issueNumber={issue.issue_number}
          issueTitle={issue.title}
          coverImage={issue.cover_image}
          coverStoryId={issue.cover_story_id}
          articles={articles}
          sponsors={sponsorRows || []}
          design={issueDesign}
        />

        {articles.length > 0 && (
          <section className="issue-toc" aria-label="Sumario de la edición">
            <div className="issue-toc-header">
              <div>
                <span>TABLE OF CONTENTS</span>
                <h2>Sumario de la edición</h2>
              </div>
              <small>
                {articles.length}{' '}
                {articles.length === 1 ? 'HISTORIA SELECCIONADA' : 'HISTORIAS SELECCIONADAS'}
              </small>
            </div>

            <ol className="issue-toc-list">
              {articles.map((art: any, index: number) => {
                const isCover = art.id === featuredArticle?.id;
                const pageInfo =
                  paginationPlan.articlePageMap[art.id] ||
                  paginationPlan.articlePageMap[art.slug];
                const pageLabel =
                  pageInfo?.pageRangeLabel || `PÁG. ${String(index + 1).padStart(2, '0')}`;
                const artPlan = paginationPlan.articlePlans.find((p) => p.article.id === art.id);
                const fascicleKind = artPlan?.fascicleKind;
                const fascicleBadge =
                  fascicleKind === 'moda-atelier'
                    ? '👗 MODA & ATELIER'
                    : fascicleKind === 'sociedad-gala'
                    ? '🥂 SOCIEDAD & GALAS'
                    : fascicleKind === 'dialogos-entrevista'
                    ? '🎙️ DIÁLOGOS'
                    : fascicleKind === 'gourmet-lifestyle'
                    ? '🍷 GOURMET'
                    : null;

                return (
                  <li key={`toc-${art.id}`} className="issue-toc-item">
                    <a
                      href={`#historia-${art.slug}`}
                      className="issue-toc-link"
                      title={`Abrir ${art.title} en la revista digital (${pageLabel})`}
                    >
                      <span className="issue-toc-num">{pageLabel}</span>
                      <div className="issue-toc-body">
                        <span className="issue-toc-meta">
                          {[
                            isCover ? 'COVER STORY' : null,
                            fascicleBadge,
                            art.category,
                            art.city,
                          ]
                            .filter(Boolean)
                            .join(' · ')
                            .toUpperCase()}
                        </span>
                        <strong>{art.title}</strong>
                        {art.author && (
                          <small className="issue-toc-author">Por {art.author}</small>
                        )}
                      </div>
                      <span className="issue-toc-cta">HOJEAR EN REVISTA →</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <section>
          <div className="issue-section-heading">
            <div>
              <span>GLAMORA EDITORIAL</span>
              <h2>Dentro de esta edición</h2>
            </div>
            <span className="issue-section-number">Nº {issue.issue_number}</span>
          </div>

          {featuredArticle && (
            <div style={{ marginBottom: 28 }}>
              <div className="issue-story-label" style={{ marginBottom: 10 }}>COVER STORY</div>
              <div className="issue-feature">
                <ArticleCard
                  article={featuredArticle}
                  large={true}
                  href={`#historia-${featuredArticle.slug}`}
                  actionLabel={`HOJEAR EN REVISTA (${paginationPlan.articlePageMap[featuredArticle.id]?.pageRangeLabel || 'PÁG. 04'}) →`}
                  secondaryLink={{
                    href: `/articulo/${featuredArticle.slug}`,
                    label: 'Ver versión web ↗',
                  }}
                />
              </div>
            </div>
          )}

          {secondaryArticles.length > 0 && (
            <>
              <div className="issue-secondary-heading">
                <span>CONTINÚA LA EDICIÓN</span>
                <div />
              </div>
              <div className="issue-grid">
                {secondaryArticles.map((article: any) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    href={`#historia-${article.slug}`}
                    actionLabel={`HOJEAR EN REVISTA (${paginationPlan.articlePageMap[article.id]?.pageRangeLabel || 'PÁG. 06'}) →`}
                    secondaryLink={{
                      href: `/articulo/${article.slug}`,
                      label: 'Ver versión web ↗',
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <footer className="issue-end">
          <span>G</span>
          <p>GLAMORA · THE DIGITAL ISSUE</p>
          <small>ESTILO · CULTURA · PERSONAS</small>
        </footer>
      </div>
    </main>
  );
}
