import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import type { Article } from '@/lib/data';

function formatPublicationDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/La_Paz',
  }).format(date);
}

const DEFAULT_TOPICS = ['PERSONALIDADES', 'ENTREVISTAS', 'PERFILES', 'VIDA SOCIAL'];

export function PeopleSection({
  articles,
  unavailable = false,
  eyebrow = 'GLAMORA · EDITORIAL',
  heading = 'PEOPLE',
  description = 'Personalidades, ideas y trayectorias que dan forma a nuestra cultura.',
  topics = DEFAULT_TOPICS,
  recentOverline = 'PERSONAS · IDEAS · CULTURA',
}: {
  articles: Article[];
  unavailable?: boolean;
  eyebrow?: string;
  heading?: string;
  description?: string;
  topics?: string[];
  recentOverline?: string;
}) {
  const [feature, ...stories] = articles;
  const featureDate = feature ? formatPublicationDate(feature.published_at) : null;
  const isLongHeading = heading.length > 8;

  return (
    <main className="container people-page">
      <header className="people-intro">
        <div className="eyebrow">{eyebrow}</div>
        <div className={`people-intro-main${isLongHeading ? ' people-intro-main-long' : ''}`}>
          <h1>{heading}</h1>
          <p>{description}</p>
        </div>
        <div className="people-index" aria-label={`Temas de ${heading}`}>
          {topics.map((topic, index) => (
            <Fragment key={topic}>
              {index > 0 && <> <i>·</i> </>}
              {topic}
            </Fragment>
          ))}
        </div>
      </header>

      {unavailable ? (
        <div className="people-state people-state-error" role="status">
          <span>GLAMORA · {heading}</span>
          <p>No pudimos cargar las historias de {heading} en este momento.</p>
          <small>Intenta volver a consultar más tarde.</small>
        </div>
      ) : feature ? (
        <section className="people-feature" aria-labelledby="people-feature-title">
          {feature.cover_image ? (
            <Link href={`/articulo/${feature.slug}`} className="people-feature-image">
              <Image
                src={feature.cover_image}
                alt={feature.title}
                fill
                priority
                unoptimized={feature.cover_image.startsWith('http')}
                sizes="(max-width: 700px) 100vw, 62vw"
              />
            </Link>
          ) : (
            <div className="people-feature-image people-feature-image-empty" role="img" aria-label="La historia no tiene fotografía disponible">
              <span>GLAMORA · {heading}</span>
            </div>
          )}

          <div className="people-feature-copy">
            <div className="people-feature-meta">
              {[feature.category, feature.city].filter(Boolean).join(' · ')}
            </div>
            <h2 id="people-feature-title">{feature.title}</h2>
            {feature.excerpt && <p className="people-feature-excerpt">{feature.excerpt}</p>}
            {(featureDate || feature.author) && (
              <div className="people-feature-byline">
                {featureDate && (
                  <time dateTime={feature.published_at || undefined}>{featureDate}</time>
                )}
                {feature.author && <span>{feature.author}</span>}
              </div>
            )}
            <Link className="people-read-link" href={`/articulo/${feature.slug}`}>
              LEER LA HISTORIA <span>↗</span>
            </Link>
          </div>
        </section>
      ) : (
        <div className="people-state" role="status">
          <span>GLAMORA · {heading}</span>
          <p>Aún no hay historias publicadas en {heading}.</p>
        </div>
      )}

      {stories.length > 0 && (
        <section className="people-recent" aria-labelledby="people-recent-title">
          <div className="section-heading">
            <div>
              <span className="section-overline">{recentOverline}</span>
              <h2 id="people-recent-title">Más historias de {heading}</h2>
            </div>
            <span className="people-story-count">
              {`${String(stories.length).padStart(2, '0')} ${stories.length === 1 ? 'HISTORIA' : 'HISTORIAS'}`}
            </span>
          </div>
          <div className={`article-grid people-stories-grid people-stories-count-${stories.length}`}>
            {stories.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                large={stories.length >= 3 && index === 0}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
