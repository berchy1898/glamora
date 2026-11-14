import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticles, type Article } from '@/lib/data';
import { readStudioConfig } from '@/lib/studio-config';
import { slugifyContributorName } from '@/lib/contributors';
import { ArticleCard } from '@/components/ArticleCard';

function resolveDisplayName(
  slug: string,
  profileName: string | undefined,
  articles: Article[],
  articleMeta: Record<string, { photographer?: string; coverageBy?: string }>
): string {
  if (profileName?.trim()) return profileName.trim();
  for (const a of articles) {
    if (slugifyContributorName(a.author) === slug && a.author?.trim()) {
      return a.author.trim();
    }
    const meta = articleMeta[a.slug];
    if (meta?.photographer && slugifyContributorName(meta.photographer) === slug) {
      return meta.photographer.trim();
    }
    if (meta?.coverageBy && slugifyContributorName(meta.coverageBy) === slug) {
      return meta.coverageBy.trim();
    }
  }
  return slug
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ''))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [studioConfig, articles] = await Promise.all([
    readStudioConfig(),
    getArticles({ limit: 100, demoFallback: false }).catch(() => [] as Article[]),
  ]);
  const profile = studioConfig.contributors?.[slug];
  const name = resolveDisplayName(
    slug,
    profile?.name,
    articles,
    studioConfig.articleMeta || {}
  );

  return {
    title: `${name} · Colaborador`,
    description:
      profile?.bio ||
      `Coberturas, entrevistas y fotografías de ${name} en GLAMORA.`,
  };
}

export default async function ContributorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [studioConfig, allArticles] = await Promise.all([
    readStudioConfig(),
    getArticles({ limit: 100, demoFallback: false }).catch(() => [] as Article[]),
  ]);

  const articleMeta = studioConfig.articleMeta || {};
  const profile = studioConfig.contributors?.[slug];

  const matchingArticles = allArticles.filter((a) => {
    const meta = articleMeta[a.slug];
    return (
      slugifyContributorName(a.author) === slug ||
      slugifyContributorName(meta?.photographer) === slug ||
      slugifyContributorName(meta?.coverageBy) === slug
    );
  });

  if (!profile && matchingArticles.length === 0) {
    notFound();
  }

  const displayName = resolveDisplayName(
    slug,
    profile?.name,
    matchingArticles,
    articleMeta
  );
  const roleLabel = profile?.role || 'Colaborador Editorial · GLAMORA';

  return (
    <main className="container contributor-page">
      <header className="contributor-header">
        <span className="eyebrow">{roleLabel.toUpperCase()}</span>
        <h1>{displayName}</h1>

        {profile?.bio ? (
          <p className="contributor-bio">{profile.bio}</p>
        ) : (
          <p className="contributor-bio">
            Firma editorial y archivo de coberturas, entrevistas y fotografía en GLAMORA.
          </p>
        )}

        {(profile?.instagram || profile?.linkedin || profile?.website) && (
          <div className="contributor-links">
            {profile.instagram && (
              <a href={profile.instagram} target="_blank" rel="noopener noreferrer">
                INSTAGRAM ↗
              </a>
            )}
            {profile.linkedin && (
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                LINKEDIN ↗
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                PORTAFOLIO ↗
              </a>
            )}
          </div>
        )}
      </header>

      <section className="contributor-archive" aria-label={`Publicaciones de ${displayName}`}>
        <div className="section-heading">
          <div>
            <span className="section-overline">ARCHIVO EDITORIAL</span>
            <h2>Historias y coberturas ({matchingArticles.length})</h2>
          </div>
          <Link href="/" className="section-action">
            VOLVER A PORTADA ↗
          </Link>
        </div>

        {matchingArticles.length > 0 ? (
          <div className={`article-grid people-stories-grid people-stories-count-${Math.min(matchingArticles.length, 3)}`}>
            {matchingArticles.map((article) => (
              <ArticleCard key={article.id} article={article} large={false} />
            ))}
          </div>
        ) : (
          <div className="editorial-note">
            <span>GLAMORA EDITORIAL</span>
            <p>Aún no hay publicaciones asignadas a este colaborador.</p>
          </div>
        )}
      </section>
    </main>
  );
}
