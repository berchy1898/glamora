import { getPublishedIssues } from '@/lib/issues-data';
import { EditionsArchiveView } from '@/components/EditionsArchiveView';

export const metadata = {
  title: 'The Issues · Hemeroteca & Archivo Digital | GLAMORA',
  description:
    'El archivo digital de GLAMORA: colecciones de portadas, fascículos temáticos y crónicas visuales en alta definición.',
};

export default async function IssuesPage() {
  const issues = await getPublishedIssues();

  return (
    <main className="container people-page issues-archive-page">
      <header className="people-intro">
        <div className="eyebrow">BIBLIOTHÈQUE GLAMORA · ARCHIVO &amp; HEMEROTECA DIGITAL</div>
        <div className="people-intro-main people-intro-main-long">
          <h1>THE ISSUES</h1>
          <p>
            El archivo vivo de GLAMORA. Cada edición reúne una cuidada curaduría de fascículos
            de moda, crónica social, entrevistas en profundidad y gastronomía de autor,
            concebida para ser leída con la cadencia y el diseño de una gran revista internacional.
          </p>
        </div>
        <div className="people-index" aria-label="Temas de THE ISSUES">
          EDICIONES DIGITALES <i>·</i> FASCÍCULOS DE AUTOR <i>·</i> LECTOR DE DOBLE PÁGINA <i>·</i> COLECCIÓN
        </div>
      </header>

      <EditionsArchiveView issues={issues} />
    </main>
  );
}
