import Image from 'next/image';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase';

export const metadata = {
  title: 'The Issues · Archivo Digital | GLAMORA',
  description:
    'El archivo digital de GLAMORA: colecciones de portadas, ediciones especiales y crónicas visuales.',
};

type MagazineIssue = {
  id: string;
  issue_number: number;
  title: string;
  slug: string;
  description?: string | null;
  cover_image?: string | null;
  published_at?: string | null;
  created_at?: string | null;
};

function formatIssueDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('es-BO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/La_Paz',
  }).format(date);
}

export default async function Issues() {
  let issues: MagazineIssue[] = [];
  let unavailable = !(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!unavailable) {
    try {
      const db = await supabaseServer();
      if (!db) {
        unavailable = true;
      } else {
        const { data, error } = await db
          .from('magazine_issues')
          .select('*')
          .eq('status', 'published')
          .order('issue_number', { ascending: false });

        if (error) {
          unavailable = true;
          console.error('[GLAMORA] Error al cargar THE ISSUES:', error.message);
        } else {
          issues = (data ?? []) as MagazineIssue[];
        }
      }
    } catch {
      unavailable = true;
      console.error('[GLAMORA] No se pudieron cargar las ediciones digitales.');
    }
  }

  const [featureIssue, ...archiveIssues] = issues;
  const featureDate = featureIssue
    ? formatIssueDate(featureIssue.published_at || featureIssue.created_at)
    : null;

  return (
    <main className="container people-page issues-archive-page">
      <header className="people-intro">
        <div className="eyebrow">THE GLAMORA DIGITAL ARCHIVE</div>
        <div className="people-intro-main people-intro-main-long">
          <h1>THE ISSUES</h1>
          <p>
            Cada edición reúne una selección curada de historias, personajes, tendencias y experiencias. El archivo editorial de Glamora.
          </p>
        </div>
        <div className="people-index" aria-label="Temas de THE ISSUES">
          EDICIONES DIGITALES <i>·</i> PORTADAS <i>·</i> ARCHIVO EDITORIAL <i>·</i> COLECCIÓN
        </div>
      </header>

      {unavailable ? (
        <div className="people-state people-state-error" role="status">
          <span>GLAMORA · THE ISSUES</span>
          <p>No pudimos cargar las ediciones digitales en este momento.</p>
          <small>Intenta volver a consultar más tarde.</small>
        </div>
      ) : featureIssue ? (
        <section className="people-feature" aria-labelledby="issue-feature-title">
          {featureIssue.cover_image ? (
            <Link href={`/ediciones/${featureIssue.slug}`} className="people-feature-image">
              <Image
                src={featureIssue.cover_image}
                alt={featureIssue.title}
                fill
                priority
                unoptimized
                sizes="(max-width: 700px) 100vw, 62vw"
              />
            </Link>
          ) : (
            <Link
              href={`/ediciones/${featureIssue.slug}`}
              className="people-feature-image people-feature-image-empty"
            >
              <span>{`GLAMORA · EDICIÓN Nº ${String(featureIssue.issue_number).padStart(2, '0')}`}</span>
            </Link>
          )}

          <div className="people-feature-copy">
            <div className="people-feature-meta">
              {`THE DIGITAL ISSUE · EDICIÓN Nº ${String(featureIssue.issue_number).padStart(2, '0')}`}
            </div>
            <h2 id="issue-feature-title">{featureIssue.title}</h2>
            <p className="people-feature-excerpt">
              {featureIssue.description ||
                'Una selección especial de perfiles, estilo, cultura y crónicas contemporáneas reunidas bajo la mirada editorial de Glamora.'}
            </p>
            {featureDate && (
              <div className="people-feature-byline">
                <span style={{ textTransform: 'uppercase' }}>{featureDate}</span>
                <span>GLAMORA · BOLIVIA</span>
              </div>
            )}
            <Link className="people-read-link" href={`/ediciones/${featureIssue.slug}`}>
              EXPLORAR EDICIÓN <span>↗</span>
            </Link>
          </div>
        </section>
      ) : (
        <div className="people-state" role="status">
          <span>GLAMORA · THE ISSUES</span>
          <p>Aún no hay ediciones digitales publicadas.</p>
        </div>
      )}

      {archiveIssues.length > 0 && (
        <section className="people-recent" aria-labelledby="issues-archive-title">
          <div className="section-heading">
            <div>
              <span className="section-overline">COLECCIÓN · ARCHIVO DIGITAL</span>
              <h2 id="issues-archive-title">Ediciones anteriores</h2>
            </div>
            <span className="people-story-count">
              {`${String(archiveIssues.length).padStart(2, '0')} ${archiveIssues.length === 1 ? 'EDICIÓN' : 'EDICIONES'}`}
            </span>
          </div>

          <div className={`article-grid people-stories-grid people-stories-count-${archiveIssues.length}`}>
            {archiveIssues.map((issue, index) => (
              <Link
                href={`/ediciones/${issue.slug}`}
                key={issue.id}
                className={`article-card ${archiveIssues.length >= 3 && index === 0 ? 'article-card-large' : ''}`}
              >
                <div className="card-image">
                  {issue.cover_image ? (
                    <Image
                      src={issue.cover_image}
                      alt={issue.title}
                      fill
                      unoptimized
                      sizes="(max-width: 700px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="image-placeholder">{`Nº ${issue.issue_number}`}</div>
                  )}
                </div>
                <div className="article-card-content">
                  <div className="card-meta">
                    {`EDICIÓN Nº ${String(issue.issue_number).padStart(2, '0')}`}
                  </div>
                  <h3>{issue.title}</h3>
                  {issue.description && <p>{issue.description}</p>}
                  <span className="read-link">EXPLORAR EDICIÓN ↗</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
