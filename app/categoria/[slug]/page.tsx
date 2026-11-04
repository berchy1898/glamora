import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PeopleSection } from '@/components/PeopleSection';
import { getArticles, type Article } from '@/lib/data';

type CategoryConfig = {
  category: string;
  categories?: string[];
  orCity?: string;
  eyebrow?: string;
  heading: string;
  description: string;
  topics: string[];
  recentOverline: string;
};

const categories: Record<string, CategoryConfig> = {
  moda: {
    category: 'Moda',
    heading: 'MODA',
    description:
      'Tendencias, editoriales de moda, diseñadores y el lenguaje visual que define el estilo contemporáneo.',
    topics: ['TENDENCIAS', 'EDITORIALES', 'DISEÑADORES', 'ESTILO'],
    recentOverline: 'ESTILO · ATELIER · TENDENCIAS',
  },
  belleza: {
    category: 'Belleza',
    heading: 'BELLEZA',
    description:
      'Rituales, cuidado personal, bienestar y las miradas estéticas que inspiran confianza y autenticidad.',
    topics: ['CUIDADO', 'ESTÉTICA', 'BIENESTAR', 'TENDENCIAS'],
    recentOverline: 'RITUALES · ESTÉTICA · BIENESTAR',
  },
  people: {
    category: 'People',
    heading: 'PEOPLE',
    description:
      'Personalidades, ideas y trayectorias que dan forma a nuestra cultura.',
    topics: ['PERSONALIDADES', 'ENTREVISTAS', 'PERFILES', 'VIDA SOCIAL'],
    recentOverline: 'PERSONAS · IDEAS · CULTURA',
  },
  lifestyle: {
    category: 'Lifestyle',
    heading: 'LIFESTYLE',
    description:
      'El arte de vivir con intención, diseño cotidiano, espacios y experiencias con sello propio.',
    topics: ['ESTILO DE VIDA', 'ESPACIOS', 'DISEÑO', 'EXPERIENCIAS'],
    recentOverline: 'VIDA · DISEÑO · INSPIRACIÓN',
  },
  society: {
    category: 'Society',
    heading: 'SOCIETY',
    description:
      'Encuentros, celebraciones, protagonistas y la escena social que da vida a nuestras ciudades.',
    topics: ['ENCUENTROS', 'PROTAGONISTAS', 'CELEBRACIONES', 'ESCENA'],
    recentOverline: 'PERSONAS · ENCUENTROS · SOCIEDAD',
  },
  viajes: {
    category: 'Viajes',
    heading: 'VIAJES',
    description:
      'Destinos, hoteles con identidad, rutas y experiencias para descubrir Bolivia y el mundo con otra mirada.',
    topics: ['DESTINOS', 'HOTELES', 'EXPERIENCIAS', 'RUTAS'],
    recentOverline: 'DESTINOS · LUGARES · EXPERIENCIAS',
  },
  cultura: {
    category: 'Cultura',
    heading: 'CULTURA',
    description:
      'Arte, música, cine, literatura y las expresiones creativas que enriquecen nuestra conversación contemporánea.',
    topics: ['ARTE', 'MÚSICA', 'CINE', 'LIBROS'],
    recentOverline: 'ARTE · ESCENA · CREACIÓN',
  },
  gastronomia: {
    category: 'Gastronomía',
    categories: ['Gastronomía', 'GASTRONOMÍA', 'The Table'],
    heading: 'GASTRONOMÍA',
    description:
      'Restaurantes, cocinas de autor, chefs, sabores y las mesas donde se celebra el encuentro.',
    topics: ['RESTAURANTES', 'CHEFS', 'SABORES DE AUTOR', 'EXPERIENCIAS'],
    recentOverline: 'SABORES · MESAS · CULTURA CULINARIA',
  },
  mundo: {
    category: 'The World',
    categories: ['Mundo', 'The World'],
    orCity: 'Internacional',
    eyebrow: 'GLAMORA · GLOBAL & SOCIAL EDITION',
    heading: 'THE WORLD',
    description:
      'Eventos internacionales, crónicas globales, capitales creativas y las historias del mundo que dialogan con Bolivia.',
    topics: ['GLAMORA SOCIAL', 'MIRADA GLOBAL', 'CAPITALES', 'CRÓNICAS'],
    recentOverline: 'PERSPECTIVA · SOCIALES · MUNDO',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = categories[slug];

  if (!config) {
    return { title: 'Sección no encontrada' };
  }

  return {
    title: config.heading,
    description: config.description,
    openGraph: {
      title: `${config.heading} | GLAMORA`,
      description: config.description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${config.heading} | GLAMORA`,
      description: config.description,
    },
  };
}

export default async function Category({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = categories[slug];

  if (!config) {
    notFound();
  }

  let articles: Article[] = [];
  let unavailable = !(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  if (!unavailable) {
    try {
      articles = await getArticles({
        category: config.category,
        categories: config.categories,
        orCity: config.orCity,
        limit: 40,
        demoFallback: false,
      });
    } catch {
      unavailable = true;
      console.error(`[GLAMORA] No se pudieron cargar las historias de ${config.heading}.`);
    }
  }

  return (
    <PeopleSection
      articles={articles}
      unavailable={unavailable}
      eyebrow={config.eyebrow}
      heading={config.heading}
      description={config.description}
      topics={config.topics}
      recentOverline={config.recentOverline}
    />
  );
}
