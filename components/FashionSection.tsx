import { PeopleSection } from '@/components/PeopleSection';
import type { Article } from '@/lib/data';

export function FashionSection({
  articles,
  unavailable = false,
}: {
  articles: Article[];
  unavailable?: boolean;
}) {
  return (
    <PeopleSection
      articles={articles}
      unavailable={unavailable}
      heading="MODA"
      description="Tendencias, editoriales de moda, diseñadores y el lenguaje visual que define el estilo contemporáneo."
      topics={['TENDENCIAS', 'EDITORIALES', 'DISEÑADORES', 'ESTILO']}
      recentOverline="ESTILO · ATELIER · TENDENCIAS"
    />
  );
}
