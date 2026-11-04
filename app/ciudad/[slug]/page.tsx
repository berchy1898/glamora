import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PeopleSection } from '@/components/PeopleSection';
import { getArticles, type Article } from '@/lib/data';

type CityConfig = {
  city: string;
  heading: string;
  description: string;
  topics: string[];
  recentOverline: string;
};

const cities: Record<string, CityConfig> = {
  cochabamba: {
    city: 'Cochabamba',
    heading: 'COCHABAMBA',
    description:
      'Eventos sociales, personalidades, gastronomía, cultura y las historias que marcan el pulso de Cochabamba.',
    topics: ['GLAMORA SOCIAL', 'PERSONALIDADES', 'GASTRONOMÍA & CULTURA', 'ESTILO DE VIDA'],
    recentOverline: 'COCHABAMBA · SOCIALES · ESCENA LOCAL',
  },
  'la-paz': {
    city: 'La Paz',
    heading: 'LA PAZ',
    description:
      'Coberturas sociales, encuentros, protagonistas, alta gastronomía y la escena cultural de La Paz.',
    topics: ['GLAMORA SOCIAL', 'PERSONALIDADES', 'CULTURA & ARTE', 'ESTILO DE VIDA'],
    recentOverline: 'LA PAZ · SOCIALES · ESCENA LOCAL',
  },
  oruro: {
    city: 'Oruro',
    heading: 'ORURO',
    description:
      'Acontecimientos sociales, tradición, cultura viva, personalidades y las historias que distinguen a Oruro.',
    topics: ['GLAMORA SOCIAL', 'PERSONALIDADES', 'PATRIMONIO & CULTURA', 'ENCUENTROS'],
    recentOverline: 'ORURO · SOCIALES · ESCENA LOCAL',
  },
  potosi: {
    city: 'Potosí',
    heading: 'POTOSÍ',
    description:
      'Encuentros sociales, historia, cultura, protagonistas y las expresiones contemporáneas de Potosí.',
    topics: ['GLAMORA SOCIAL', 'PERSONALIDADES', 'CULTURA & PATRIMONIO', 'ENCUENTROS'],
    recentOverline: 'POTOSÍ · SOCIALES · ESCENA LOCAL',
  },
  'santa-cruz': {
    city: 'Santa Cruz',
    heading: 'SANTA CRUZ',
    description:
      'Vida social, grandes eventos, moda, gastronomía, personalidades y el dinamismo contemporáneo de Santa Cruz.',
    topics: ['GLAMORA SOCIAL', 'PERSONALIDADES', 'MODA & EVENTOS', 'ESTILO DE VIDA'],
    recentOverline: 'SANTA CRUZ · SOCIALES · ESCENA LOCAL',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = cities[slug];

  if (!config) {
    return { title: 'Ciudad no encontrada' };
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

export default async function City({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = cities[slug];

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
        city: config.city,
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
      eyebrow="GLAMORA · CITY & SOCIAL EDITION"
      heading={config.heading}
      description={config.description}
      topics={config.topics}
      recentOverline={config.recentOverline}
    />
  );
}
