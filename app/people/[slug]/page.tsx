import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticles } from '@/lib/data';
import { ArticleCard } from '@/components/ArticleCard';
import { EditorialGallery } from '@/components/EditorialGallery';

function normalizePersonKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatSlugAsName(slug: string): string {
  return decodeURIComponent(slug)
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fallbackName = formatSlugAsName(slug);

  return {
    title: `${fallbackName} · The Society Index`,
    description: `Coberturas, retratos y apariciones editoriales de ${fallbackName} en GLAMORA.`,
  };
}

export default async function PersonProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const targetKey = normalizePersonKey(decodeURIComponent(slug));

  const allArticles = await getArticles({ limit: 80, demoFallback: false });

  let canonicalName = formatSlugAsName(slug);

  const matchedArticles = allArticles.filter((art) => {
    const tags = Array.isArray(art.people_tags) ? art.people_tags : [];
    for (const rawTag of tags) {
      if (typeof rawTag === 'string' && normalizePersonKey(rawTag) === targetKey) {
        canonicalName = rawTag.trim();
        return true;
      }
    }
    return false;
  });

  // Recopilar fotografías de las coberturas donde aparece
  const personPhotos: { src: string; alt: string; caption: string }[] = [];
  for (const art of matchedArticles) {
    if (art.cover_image) {
      personPhotos.push({
        src: art.cover_image,
        alt: `${canonicalName} en ${art.event_name || art.title}`,
        caption: `${art.event_name || art.title} · ${art.city || 'BOLIVIA'}`,
      });
    }
    const gallery = Array.isArray(art.gallery_images) ? art.gallery_images : [];
    for (const img of gallery.slice(0, 4)) {
      if (img && img !== art.cover_image) {
        personPhotos.push({
          src: img,
          alt: `${canonicalName} · ${art.event_name || art.title}`,
          caption: `${art.event_name || art.title} · ${art.city || 'BOLIVIA'}`,
        });
      }
    }
  }

  return (
    <main className="container people-page">
      <section className="people-intro">
        <div className="eyebrow">GLAMORA SOCIETY INDEX · ARCHIVO PERSONAL</div>
        <div className="people-intro-main">
          <h1>{canonicalName}</h1>
          <p>
            Registro editorial de apariciones, crónicas sociales, retratos y eventos destacados en las páginas de GLAMORA.
          </p>
        </div>

        <div className="people-index">
          <span>
            {matchedArticles.length}{' '}
            {matchedArticles.length === 1 ? 'APARICIÓN EDITORIAL' : 'APARICIONES EDITORIALES'}
          </span>
          <i>·</i>
          <span>{personPhotos.length} FOTOGRAFÍAS EN ARCHIVO</span>
          <i>·</i>
          <Link href="/social" style={{ textDecoration: 'underline' }}>
            EXPLORAR GLAMORA SOCIAL ↗
          </Link>
        </div>
      </section>

      {matchedArticles.length > 0 ? (
        <>
          <section style={{ paddingTop: 42 }}>
            <div className="section-heading">
              <div>
                <span className="section-overline">IN THE PAGES OF GLAMORA</span>
                <h2>Historias y coberturas</h2>
              </div>
            </div>

            <div
              className={`article-grid people-stories-grid people-stories-count-${Math.min(
                matchedArticles.length,
                3
              )}`}
            >
              {matchedArticles.map((art, idx) => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  large={matchedArticles.length === 1 && idx === 0}
                />
              ))}
            </div>
          </section>

          {personPhotos.length > 0 && (
            <section style={{ paddingTop: 58 }}>
              <div className="section-heading">
                <div>
                  <span className="section-overline">THE PHOTO ARCHIVE</span>
                  <h2>Galería de momentos</h2>
                </div>
              </div>
              <EditorialGallery photos={personPhotos.slice(0, 12)} />
            </section>
          )}
        </>
      ) : (
        <div className="editorial-note" style={{ marginTop: 42 }}>
          <span>GLAMORA SOCIETY INDEX</span>
          <p>
            Aún no hay coberturas publicadas etiquetadas con el nombre de {canonicalName}.
          </p>
        </div>
      )}
    </main>
  );
}
