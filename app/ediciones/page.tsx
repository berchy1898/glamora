import { getPublishedIssues } from '@/lib/issues-data';
import { EditionsArchiveView } from '@/components/EditionsArchiveView';

export const metadata = {
  title: 'GLAMORA The Issues · Archivo Digital & Colección',
  description:
    'El archivo digital de GLAMORA: colecciones de portadas, grandes crónicas y reportajes visuales en alta definición.',
};

export default async function IssuesPage() {
  const issues = await getPublishedIssues();

  return (
    <main className="container people-page issues-archive-page">
      <header className="people-intro">
        <div className="eyebrow">BIBLIOTHÈQUE GLAMORA · ARCHIVO &amp; COLECCIÓN DIGITAL</div>
        <div className="people-intro-main people-intro-main-long">
          <h1>GLAMORA THE ISSUES</h1>
          <p>
            El archivo vivo de GLAMORA. Cada edición reúne una cuidada curaduría
            de moda, crónica social, entrevistas en profundidad y gastronomía de autor,
            concebida para ser leída con la cadencia y el diseño de una gran revista internacional.
          </p>
        </div>
        <div className="people-index" aria-label="Temas de GLAMORA THE ISSUES">
          EDICIONES DIGITALES <i>·</i> PORTADAS <i>·</i> LECTOR DE DOBLE PÁGINA <i>·</i> COLECCIÓN
        </div>
      </header>

      <EditionsArchiveView issues={issues} />
    </main>
  );
}
