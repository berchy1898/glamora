import Image from 'next/image';
import Link from 'next/link';
import { getArticles, type Article } from '@/lib/data';
import { ArticleCard } from '@/components/ArticleCard';
import { EditorialGallery } from '@/components/EditorialGallery';

export const metadata = { title: 'Glamora Social | Eventos y galerías' };

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

const socialCityLinks = [
  ['TODOS', '/social'],
  ['COCHABAMBA', '/ciudad/cochabamba'],
  ['LA PAZ', '/ciudad/la-paz'],
  ['ORURO', '/ciudad/oruro'],
  ['POTOSÍ', '/ciudad/potosi'],
  ['SANTA CRUZ', '/ciudad/santa-cruz'],
  ['THE WORLD', '/categoria/mundo'],
] as const;

export default async function Social() {
  let articles: Article[] = [];
  let unavailable = !(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!unavailable) {
    try {
      articles = await getArticles({
        social: true,
        limit: 40,
        demoFallback: false,
      });
    } catch {
      unavailable = true;
      console.error('[GLAMORA] No se pudieron cargar las coberturas de SOCIALES.');
    }
  }

  const [feature, ...stories] = articles;
  const featureDate = feature ? formatPublicationDate(feature.published_at) : null;
  const featureGallery = feature?.gallery_images?.filter(Boolean) ?? [];
  const featurePeople = feature?.people_tags?.filter(Boolean) ?? [];

  return (
    <main className="container people-page social-page">
      <header className="people-intro">
        <div className="eyebrow">THE PEOPLE · THE MOMENTS · THE SCENE</div>
        <div className="people-intro-main people-intro-main-long">
          <h1>SOCIALES</h1>
          <p>
            Las personas, los lugares y las celebraciones que construyen la vida social de nuestras ciudades.
          </p>
        </div>
        <div className="people-index" aria-label="Temas de SOCIALES">
          EVENTOS <i>·</i> ENCUENTROS <i>·</i> CELEBRACIONES <i>·</i> GALERÍAS
        </div>
      </header>

      <nav className="social-filters" aria-label="Filtrar coberturas por ciudad">
        {socialCityLinks.map(([label, href], index) => (
          <Link href={href} key={label} className={index === 0 ? 'filter-active' : ''}>
            {label}
          </Link>
        ))}
      </nav>

      {unavailable ? (
        <div className="people-state people-state-error" role="status">
          <span>GLAMORA · SOCIALES</span>
          <p>No pudimos cargar las coberturas de SOCIALES en este momento.</p>
          <small>Intenta volver a consultar más tarde.</small>
        </div>
      ) : feature ? (
        <>
          <section className="people-feature" aria-labelledby="social-feature-title">
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
              <div
                className="people-feature-image people-feature-image-empty"
                role="img"
                aria-label="La cobertura no tiene fotografía disponible"
              >
                <span>GLAMORA · SOCIALES</span>
              </div>
            )}

            <div className="people-feature-copy">
              <div className="people-feature-meta">
                {[feature.city || 'BOLIVIA', 'GLAMORA SOCIAL', feature.venue]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
              <h2 id="social-feature-title">{feature.title}</h2>
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
                VER COBERTURA COMPLETA <span>↗</span>
              </Link>
            </div>
          </section>

          {(featureGallery.length > 0 || featurePeople.length > 0) && (
            <section className="social-diary-section" aria-labelledby="social-diary-title">
              <div className="section-heading">
                <div>
                  <span className="section-overline">INSIDE THE EXPERIENCE · PHOTO DIARY</span>
                  <h2 id="social-diary-title">{feature.event_name || 'Momentos de la cobertura'}</h2>
                </div>
                <span className="people-story-count">
                  {feature.city || 'BOLIVIA'}
                  {feature.event_date
                    ? ` · ${new Date(`${feature.event_date}T12:00:00`).toLocaleDateString('es-BO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}`
                    : ''}
                </span>
              </div>

              {featureGallery.length > 0 && (
                <EditorialGallery
                  photos={featureGallery.map((rawImage, index) => {
                    let src = rawImage.trim();
                    let caption = '';
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
                    if (!caption) {
                      if (featurePeople.length > 0) {
                        if (index < featurePeople.length) {
                          peopleInFrame = featurePeople[index];
                        }
                        caption = feature.event_name || feature.title;
                      } else {
                        caption = feature.event_name || feature.title;
                      }
                    }

                    return {
                      src,
                      alt: caption || `Fotografía ${index + 1} de ${feature.event_name || feature.title}`,
                      caption,
                      people: peopleInFrame,
                      overline: peopleInFrame ? 'EN EL ENCUADRE' : 'GLAMORA SOCIAL',
                    };
                  })}
                />
              )}

              {featurePeople.length > 0 && (
                <div className="social-people">
                  <span className="section-overline">IN THE FRAME</span>
                  <p>{featurePeople.join(' · ')}</p>
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <div className="people-state" role="status">
          <span>GLAMORA · SOCIALES</span>
          <p>Aún no hay coberturas publicadas en SOCIALES.</p>
        </div>
      )}

      {stories.length > 0 && (
        <section className="people-recent" aria-labelledby="social-recent-title">
          <div className="section-heading">
            <div>
              <span className="section-overline">MORE FROM THE SCENE</span>
              <h2 id="social-recent-title">Más historias de SOCIALES</h2>
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
