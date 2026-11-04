
import Image from 'next/image';
import Link from 'next/link';
import type { Article } from '@/lib/data';

export function ArticleCard({
  article,
  large = false,
}: {
  article: Article;
  large?: boolean;
}) {
  return (
    <Link
      href={`/articulo/${article.slug}`}
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

        {article.excerpt && (
          <p>{article.excerpt}</p>
        )}

        <span className="read-link">
          LEER HISTORIA ↗
        </span>
      </div>
    </Link>
  );
}
