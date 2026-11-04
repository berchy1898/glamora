import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArticle, getArticles, type Article } from '@/lib/data';
import { extractEditorialVideo } from '@/lib/editorial-video';
import { EditorialBodyRenderer } from '@/components/EditorialBodyRenderer';
import { EditorialVideoPlayer } from '@/components/EditorialVideoPlayer';
import { EditorialGallery } from '@/components/EditorialGallery';
import { ArticleCard } from '@/components/ArticleCard';
import { ReadingTracker, ArticleShareBarWidget } from '@/components/ArticleClientWidgets';

function estimateReadingMinutes(text: string): number {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 190));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(slug);

  if (!a) {
    return {
      title: 'Historia no encontrada',
    };
  }

  const description =
    a.excerpt ||
    `${a.category}${a.city ? ` · ${a.city}` : ''} — Una historia editorial de GLAMORA.`;
  const images = a.cover_image
    ? [{ url: a.cover_image, alt: a.title }]
    : [{ url: '/brand/glamora-mark.png', alt: 'GLAMORA' }];

  return {
    title: a.title,
    description,
    openGraph: {
      title: `${a.title} | GLAMORA`,
      description,
      type: 'article',
      publishedTime: a.published_at || undefined,
      authors: a.author ? [a.author] : ['GLAMORA Editorial'],
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${a.title} | GLAMORA`,
      description,
      images: a.cover_image ? [a.cover_image] : ['/brand/glamora-mark.png'],
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getArticle(slug);

  if (!a) notFound();

  let relatedArticles: Article[] = [];
  try {
    const recent = await getArticles({ limit: 4, demoFallback: false });
    relatedArticles = recent.filter((item) => item.slug !== a.slug).slice(0, 3);
  } catch {
    relatedArticles = [];
  }

  const peopleTags = (a.people_tags ?? []).filter(Boolean);
  const { cleanBody, video: featuredVideo } = extractEditorialVideo(a.body);
  const readingMinutes = estimateReadingMinutes(cleanBody);

  const date = a.published_at
    ? new Date(a.published_at).toLocaleDateString('es-BO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const photos = (a.gallery_images ?? []).filter(Boolean).map((rawItem, i) => {
    let src = rawItem.trim();
    let caption = '';

    // Soporte para formato "url | descripción o nombres"
    if (src.includes(' | ')) {
      const parts = src.split(' | ');
      src = parts[0].trim();
      caption = parts.slice(1).join(' | ').trim();
    } else if (src.includes('|')) {
      const parts = src.split('|');
      src = parts[0].trim();
      caption = parts.slice(1).join('|').trim();
    }

    let peopleInFrame: string | undefined = undefined;

    // Si no se asignó un pie de foto personalizado en la URL:
    if (!caption) {
      if (peopleTags.length > 0) {
        if (peopleTags.length === 1) {
          peopleInFrame = peopleTags[0];
          caption = a.event_name ? `${a.event_name}${a.venue ? ` · ${a.venue}` : ''}` : a.title;
        } else if (i < peopleTags.length) {
          peopleInFrame = peopleTags[i];
          caption = a.event_name ? `${a.event_name}` : a.title;
        } else {
          caption = a.event_name ? `${a.event_name}${a.venue ? ` · ${a.venue}` : ''}` : a.title;
        }
      } else if (a.event_name) {
        caption = `${a.event_name}${a.venue ? ` · ${a.venue}` : ''}`;
      } else {
        caption = a.city ? `Cobertura editorial · ${a.city}` : a.title;
      }
    }

    return {
      src,
      alt: caption || `Fotografía ${i + 1} de ${a.event_name || a.title}`,
      caption,
      people: peopleInFrame,
      overline: peopleInFrame ? 'EN EL ENCUADRE' : (a.category || 'GLAMORA SOCIAL'),
    };
  });

  return (
    <main className="container glamora-article-page">
      <ReadingTracker slug={a.slug} />
      <article className="article-body">
        <header className="editorial-article-header">
          <div className="article-topline">
            <span className="eyebrow">
              {a.category}{a.city ? ` · ${a.city}` : ''}
            </span>
            <span>GLAMORA EDITORIAL</span>
          </div>

          <h1>{a.title}</h1>

          {a.excerpt && <p className="lead">{a.excerpt}</p>}

          <div className="article-byline">
            <span>POR {a.author || 'GLAMORA EDITORIAL'}</span>
            {date && <span>{date.toUpperCase()}</span>}
            <span>{readingMinutes} MIN DE LECTURA</span>
            <span>GLAMORA · BOLIVIA</span>
          </div>
        </header>

        {a.cover_image && (
          <figure className="editorial-article-cover">
            <div className="editorial-cover-image">
              <img
                src={a.cover_image}
                alt={a.title}
                loading="eager"
              />
            </div>
            <figcaption>
              GLAMORA EDITORIAL · {a.category}
            </figcaption>
          </figure>
        )}

        <EditorialBodyRenderer body={cleanBody} articleTitle={a.title} />

        {featuredVideo && (
          <EditorialVideoPlayer video={featuredVideo} title={a.title} />
        )}

        {(a.is_social || photos.length > 0 || peopleTags.length > 0) && (
          <section className="article-gallery">
            <div className="section-heading">
              <div>
                <span className="section-overline">
                  GLAMORA SOCIAL · PHOTO DIARY
                </span>
                <h2>{a.event_name || 'Momentos de la cobertura'}</h2>
              </div>

              <span className="section-action">
                {a.venue || a.city || 'BOLIVIA'}
              </span>
            </div>

            {photos.length > 0 && <EditorialGallery photos={photos} />}

            {peopleTags.length > 0 && (
              <div className="social-people">
                <span className="section-overline">IN THE FRAME · CLIC PARA VER ARCHIVO</span>
                <p className="social-people-links">
                  {peopleTags.map((personName, idx) => {
                    const personSlug = personName
                      .trim()
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    return (
                      <span key={`${personSlug}-${idx}`}>
                        {idx > 0 && <i className="social-people-dot"> · </i>}
                        <Link
                          href={`/people/${personSlug}`}
                          className="social-person-link"
                        >
                          {personName}
                        </Link>
                      </span>
                    );
                  })}
                </p>
              </div>
            )}
          </section>
        )}

        <ArticleShareBarWidget
          slug={a.slug}
          title={a.title}
          category={a.category}
        />

        <footer className="article-end">
          <span>—</span>
          <p>ESTILO · ELEGANCIA · INSPIRACIÓN</p>
          <span>GLAMORA · BOLIVIA</span>
        </footer>
      </article>

      {relatedArticles.length > 0 && (
        <section
          className="article-related-section"
          aria-labelledby="related-stories-title"
        >
          <div className="section-heading">
            <div>
              <span className="section-overline">CONTINUE READING</span>
              <h2 id="related-stories-title">Más historias en GLAMORA</h2>
            </div>
            <Link href="/" className="section-action">
              VER PORTADA ↗
            </Link>
          </div>

          <div
            className={`article-grid people-stories-grid people-stories-count-${relatedArticles.length}`}
          >
            {relatedArticles.map((related) => (
              <ArticleCard
                key={related.id}
                article={related}
                large={false}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
