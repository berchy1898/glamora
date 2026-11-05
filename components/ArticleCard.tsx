import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/lib/data';

export function ArticleCard({
  article,
  large = false,
  href,
  actionLabel,
  secondaryLink,
}: {
  article: Article;
  large?: boolean;
  href?: string;
  actionLabel?: string;
  secondaryLink?: { href: string; label: string };
}) {
  const targetHref = href || `/articulo/${article.slug}`;
  const isInternalIssueAnchor = targetHref.startsWith('#');

  // Si es un ancla interna de The Issues (ej. #historia-slug), usamos <article> como contenedor
  // para permitir enlaces limpios e independientes sin anidar <a> dentro de <a>
  if (isInternalIssueAnchor) {
    return (
      <article className={`article-card ${large ? 'article-card-large' : ''}`}>
        <a
          href={targetHref}
          className="card-image"
          style={{ display: 'block', textDecoration: 'none' }}
          title={`Hojear ${article.title} en la revista`}
        >
          {article.cover_image ? (
            <Image
              src={article.cover_image}
              alt={article.title}
              fill
              unoptimized={article.cover_image.startsWith('http')}
              sizes={
                large
                  ? '(max-width: 700px) 100vw, 60vw'
                  : '(max-width: 700px) 50vw, 33vw'
              }
            />
          ) : (
            <div className="image-placeholder">GLAMORA</div>
          )}
        </a>

        <div className="article-card-content">
          <div className="card-meta">
            {article.category}
            {article.city ? ` · ${article.city}` : ''}
          </div>

          <h3>
            <a
              href={targetHref}
              style={{ color: 'inherit', textDecoration: 'none' }}
              title={`Hojear ${article.title} en la revista`}
            >
              {article.title}
            </a>
          </h3>

          {article.excerpt && <p>{article.excerpt}</p>}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 10,
            }}
          >
            <a
              href={targetHref}
              className="read-link"
              style={{ margin: 0, textDecoration: 'none' }}
            >
              {actionLabel || 'HOJEAR EN REVISTA →'}
            </a>
            {secondaryLink && (
              <Link
                href={secondaryLink.href}
                style={{
                  fontSize: 10,
                  color: '#8a7c73',
                  textDecoration: 'underline',
                  letterSpacing: '0.05em',
                }}
              >
                {secondaryLink.label}
              </Link>
            )}
          </div>
        </div>
      </article>
    );
  }

  // Comportamiento estándar para el resto del sitio
  return (
    <Link
      href={targetHref}
      className={`article-card ${large ? 'article-card-large' : ''}`}
    >
      <div className="card-image">
        {article.cover_image ? (
          <Image
            src={article.cover_image}
            alt={article.title}
            fill
            unoptimized={article.cover_image.startsWith('http')}
            sizes={
              large
                ? '(max-width: 700px) 100vw, 60vw'
                : '(max-width: 700px) 50vw, 33vw'
            }
          />
        ) : (
          <div className="image-placeholder">GLAMORA</div>
        )}
      </div>

      <div className="article-card-content">
        <div className="card-meta">
          {article.category}
          {article.city ? ` · ${article.city}` : ''}
        </div>

        <h3>{article.title}</h3>

        {article.excerpt && <p>{article.excerpt}</p>}

        <span className="read-link">{actionLabel || 'LEER HISTORIA ↗'}</span>
      </div>
    </Link>
  );
}
