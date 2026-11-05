import Image from 'next/image';
import Link from 'next/link';
import { getArticles, getCoverArticle, type Article } from '@/lib/data';
import { excludeCoverFromRecent } from '@/lib/cover-selection';
import { ArticleCard } from '@/components/ArticleCard';
import { HeroCoverImage } from '@/components/HeroCoverImage';
import { SocialAdaptiveTile } from '@/components/SocialAdaptiveTile';
import { SponsorSlot } from '@/components/SponsorSlot';
import { readStudioConfig } from '@/lib/studio-config';
import { getLatestPublishedIssue } from '@/lib/issues-data';
import { HomeIssueSidebar } from '@/components/HomeIssueSidebar';

type SocialTileItem = {
  key: string;
  href: string;
  title: string;
  city: string;
  tag: string;
  image: string;
  alt: string;
  cta: string;
};

function buildSocialTiles(
  socialArticles: Article[],
  recentArticles: Article[]
): SocialTileItem[] {
  const validSocial = socialArticles.filter(
    (item) => item.cover_image || (item.gallery_images && item.gallery_images.length > 0)
  );

  if (validSocial.length >= 2) {
    return validSocial.slice(0, 3).map((item, idx) => {
      const image = item.cover_image || item.gallery_images?.[0] || '';
      return {
        key: `${item.id}-${idx}`,
        href: `/articulo/${item.slug}`,
        title: item.event_name || item.title,
        city: (item.city || 'BOLIVIA').toUpperCase(),
        tag: 'GLAMORA SOCIAL',
        image,
        alt: item.title,
        cta: 'VER COBERTURA ↗',
      };
    });
  }

  const singleSource =
    validSocial[0] ||
    recentArticles.find(
      (item) => (item.gallery_images?.filter(Boolean).length ?? 0) > 0
    );

  if (!singleSource) return [];

  const gallery = (singleSource.gallery_images ?? []).filter(Boolean);
  const cityLabel = (singleSource.city || 'BOLIVIA').toUpperCase();
  const baseTitle = singleSource.event_name || singleSource.title;
  const tagLabel = singleSource.is_social ? 'GLAMORA SOCIAL' : 'PHOTO DIARY';

  if (gallery.length >= 3) {
    return gallery.slice(0, 3).map((img, idx) => ({
      key: `${singleSource.id}-gal-${idx}`,
      href: `/articulo/${singleSource.slug}`,
      title:
        idx === 0
          ? baseTitle
          : `${baseTitle} · Fotografía 0${idx + 1}`,
      city: cityLabel,
      tag: tagLabel,
      image: img,
      alt: `Fotografía ${idx + 1} de ${baseTitle}`,
      cta: 'VER GALERÍA ↗',
    }));
  }

  const images = [
    singleSource.cover_image,
    ...gallery.filter((img) => img !== singleSource.cover_image),
  ].filter(Boolean) as string[];

  return images.slice(0, 3).map((img, idx) => ({
    key: `${singleSource.id}-img-${idx}`,
    href: `/articulo/${singleSource.slug}`,
    title:
      idx === 0
        ? baseTitle
        : `${baseTitle} · Momento 0${idx + 1}`,
    city: cityLabel,
    tag: tagLabel,
    image: img,
    alt: `${baseTitle} (${idx + 1})`,
    cta: 'VER COBERTURA ↗',
  }));
}

function formatEditorialDate(value: string | null | undefined) {
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

export default async function Home() {
  const [coverResult, articlesResult, socialResult, issueResult] = await Promise.allSettled([
    getCoverArticle(),
    getArticles({ limit: 7, demoFallback: false }),
    getArticles({ social: true, limit: 3, demoFallback: false }),
    getLatestPublishedIssue(),
  ]);

  const hero = coverResult.status === 'fulfilled' ? coverResult.value.article : null;
  const coverUnavailable =
    coverResult.status === 'rejected' ||
    (coverResult.status === 'fulfilled' && coverResult.value.unavailable);
  const articles = articlesResult.status === 'fulfilled' ? articlesResult.value : [];
  const socialArticles = socialResult.status === 'fulfilled' ? socialResult.value : [];
  const articlesUnavailable = articlesResult.status === 'rejected';
  const latestIssue = issueResult.status === 'fulfilled' ? issueResult.value : null;

  if (articlesUnavailable) {
    console.error('[GLAMORA] No se pudieron cargar las historias recientes.');
  }

  const studioConfig = await readStudioConfig();
  const articleViews = studioConfig.articleViews || {};

  const rest = excludeCoverFromRecent(articles, hero).slice(0, 6);
  const visibleArticles = rest.slice(0, 3);
  const trendingArticles = [hero, ...rest]
    .filter((item): item is Article => Boolean(item))
    .sort((a, b) => (articleViews[b.slug] || 0) - (articleViews[a.slug] || 0))
    .slice(0, 3);
  const socialTiles = buildSocialTiles(socialArticles, articles);

  return (
    <main>
      <section className="container hero" aria-labelledby="cover-title">
        <div className="hero-kicker">
          <span>THE COVER STORY</span>
          <span>·</span>
          <span>BOLIVIA, IN FOCUS</span>
        </div>

        <div className="hero-grid">
          {hero?.cover_image ? (
            <HeroCoverImage
              slug={hero.slug}
              src={hero.cover_image}
              alt={hero.title}
              city={hero.city}
            />
          ) : (
            <div className="hero-image hero-empty" role="status">
              <span>
                {coverUnavailable
                  ? 'PORTADA NO DISPONIBLE'
                  : hero
                    ? 'IMAGEN NO DISPONIBLE'
                    : 'SIN HISTORIAS PUBLICADAS'}
              </span>
            </div>
          )}

          <div className="hero-copy">
            <div className="eyebrow hero-meta">
              {[
                hero?.category,
                hero?.city,
                hero?.is_social ? 'GLAMORA SOCIAL' : 'GLAMORA EDITORIAL',
              ]
                .filter(Boolean)
                .join(' · ')
                .toUpperCase()}
            </div>

            <h1 id="cover-title">
              {hero?.title ||
                (coverUnavailable
                  ? 'La portada no está disponible en este momento.'
                  : 'Aún no hay historias publicadas.')}
            </h1>

            {hero?.excerpt && <p>{hero.excerpt}</p>}

            {hero && formatEditorialDate(hero.published_at) && (
              <div className="hero-byline">
                <time dateTime={hero.published_at || undefined}>{formatEditorialDate(hero.published_at)}</time>
                {hero.author && <span>{hero.author}</span>}
              </div>
            )}

            {hero && (
              <Link className="text-link" href={`/articulo/${hero.slug}`}>
                LEER LA HISTORIA <span>↗</span>
              </Link>
            )}

            <div className="hero-note">
              <span>01</span>
              <span>HISTORIAS CON MIRADA PROPIA</span>
            </div>
          </div>
        </div>
      </section>

      {trendingArticles.length > 0 && (
        <section className="trending-strip" aria-label="En tendencia en Glamora">
          <div className="container trending-inner">
            <div className="trending-label">
              <span>EN TENDENCIA</span>
              <small>LO MÁS LEÍDO EN GLAMORA</small>
            </div>
            <div className="trending-list">
              {trendingArticles.map((item, idx) => (
                <Link
                  key={`trend-${item.id}`}
                  href={`/articulo/${item.slug}`}
                  className="trending-item"
                >
                  <span className="trending-index">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="trending-copy">
                    <small>
                      {[item.category, item.city]
                        .filter(Boolean)
                        .join(' · ')
                        .toUpperCase()}
                    </small>
                    <strong>{item.title}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container latest-section">
        <div className="section-heading">
          <div>
            <span className="section-overline">THE EDIT</span>
            <h2>Historias recientes</h2>
          </div>
          <Link href="/ediciones" className="section-action">
            VER ARCHIVO ↗
          </Link>
        </div>

        <div className={latestIssue ? 'latest-with-sidebar-wrap' : ''}>
          <div className="latest-articles-col">
            {visibleArticles.length > 0 ? (
              <div className={`article-grid editorial-story-grid article-grid-count-${visibleArticles.length}`}>
                {visibleArticles.map((article, index) => (
                  <ArticleCard key={article.id} article={article} large={visibleArticles.length === 3 && index === 0} />
                ))}
              </div>
            ) : articlesUnavailable ? (
              <div className="editorial-note" role="status">
                <span>GLAMORA EDITORIAL</span>
                <p>Las historias recientes no están disponibles temporalmente.</p>
              </div>
            ) : (
              <div className="editorial-note">
                <span>GLAMORA EDITORIAL</span>
                <p>Aún no hay historias publicadas.</p>
              </div>
            )}
          </div>

          {/* A un costado: GLAMORA The Issue — Anuncio de Nuestra Primera Edición */}
          {latestIssue && <HomeIssueSidebar issue={latestIssue} />}
        </div>
      </section>

      <section className="social-band">
        <div className="container">
          <div className="section-heading light-heading">
            <div>
              <span className="section-overline">
                THE PEOPLE · THE MOMENTS · THE SCENE
              </span>
              <h2>Glamora Social</h2>
            </div>
            <Link href="/social" className="section-action">
              EXPLORAR GALERÍAS ↗
            </Link>
          </div>

          <p className="social-intro">
            Los lugares, las personas y los encuentros que hacen especial la
            vida social de nuestras ciudades.
          </p>

          {socialTiles.length > 0 ? (
            <div className="social-grid">
              {socialTiles.map((item, index) => (
                <SocialAdaptiveTile
                  item={item}
                  index={index}
                  key={item.key}
                />
              ))}
            </div>
          ) : (
            <div className="editorial-note" style={{ borderColor: 'rgba(246, 242, 236, .16)', color: '#e8e0d8' }}>
              <span style={{ color: '#c8a3ad' }}>GLAMORA SOCIAL</span>
              <p style={{ color: '#f6f2ec' }}>Próximamente nuevas coberturas y galerías sociales.</p>
            </div>
          )}
        </div>
      </section>

      <section className="container sponsor-wrap">
        <SponsorSlot placement="Homepage" />
      </section>
    </main>
  );
}
