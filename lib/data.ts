import { supabaseServer } from './supabase';
import { chooseCoverArticle } from './cover-selection';

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  category: string;
  city: string | null;
  cover_image: string | null;
  author: string | null;
  published_at: string | null;
  is_published: boolean;
  is_social: boolean;
  is_cover?: boolean;
  created_at?: string;
  event_name?: string | null;
  venue?: string | null;
  event_date?: string | null;
  gallery_images?: string[] | null;
  people_tags?: string[] | null;
};

const demoArticles: Article[] = [
  {
    id: 'demo-noches-llajta',
    title: 'Noches en la Llajta: música, pizza y sabor de autor en La Muela del Diablo',
    slug: 'noches-en-la-llajta',
    excerpt:
      'Una noche donde la gastronomía artesanal, la música en vivo y la coctelería de autor se encuentran en uno de los espacios culturales de Cochabamba.',
    body: `Una noche que se vive en todos los sentidos

En Cochabamba, hay lugares que consiguen reunir buena música, hospitalidad y una propuesta gastronómica con personalidad. La Muela del Diablo es uno de esos espacios donde cada detalle contribuye a crear una noche para recordar.

ATENCIÓN QUE TE HACE SENTIR VIP

Llegamos en pleno horario de movimiento y encontramos un ambiente lleno de energía. La atención cercana y la disposición del equipo hicieron que la experiencia resultara cómoda desde el primer momento.

EL SOUNDTRACK DE LA NOCHE

La música en vivo estuvo a cargo de The New Old, que recorrió clásicos del pop, rock y cumbia con una energía que acompañó el ambiente de principio a fin.

ARTE ITALIANO Y GASTRONOMÍA DE AUTOR

Entre las opciones de la carta, probamos la Pizza Llegas: salsa de tomate, mozzarella y stracciatella, tomates cherry confitados, tomates deshidratados y pesto de albahaca. Una combinación de sabores y texturas que merece su propio momento.

COCTELERÍA QUE CUENTA HISTORIAS

La carta también invita a explorar la coctelería de autor. Entre las creaciones que probamos estuvieron El Viaje de Bennet, con singani, ron boliviano y notas de naranja y lima; y Domingo Cochala, una combinación de ron, singani, chirimoya, pomelo y un guiño nostálgico al helado de canela. Para acompañar la pizza, elegimos un vino Tannat que aportó carácter al maridaje.

La Muela del Diablo reúne música, gastronomía y encuentros en una misma dirección: disfrutar la noche cochabambina. Una dirección para tener en cuenta cuando el plan pide algo más que salir a cenar.

GLAMORA recomienda descubrir el lugar y formar una opinión propia. Las experiencias y preferencias pueden variar.`,
    category: 'GASTRONOMÍA',
    city: 'COCHABAMBA',
    cover_image: '/media/muela-musica.jpg',
    author: 'GLAMORA EDITORIAL',
    published_at: '2026-05-10T20:00:00-04:00',
    is_published: true,
    is_social: true,
    is_cover: true,
  },
];

function filterDemoArticles(
  options: { category?: string; social?: boolean; limit?: number } = {},
): Article[] {
  const limit = Math.max(0, options.limit ?? 12);

  return demoArticles
    .filter((article) => {
      const matchesCategory =
        !options.category ||
        article.category.toLowerCase() === options.category.toLowerCase();

      const matchesSocial =
        options.social !== true || article.is_social;

      return matchesCategory && matchesSocial;
    })
    .slice(0, limit);
}

function normalizeEditorialToken(value: string | null | undefined): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function getArticles(
  options: {
    category?: string;
    categories?: string[];
    city?: string;
    orCity?: string;
    social?: boolean;
    limit?: number;
    demoFallback?: boolean;
  } = {},
): Promise<Article[]> {
  const db = await supabaseServer();

  // Datos de demostración únicamente cuando no hay cliente Supabase.
  if (!db) {
    if (options.demoFallback === false) return [];
    return filterDemoArticles(options);
  }

  const limit = Math.max(0, options.limit ?? 12);
  const needsClientSideCityMatch = Boolean(options.city || options.orCity || options.social);

  let query = db
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(needsClientSideCityMatch ? Math.max(limit, 80) : limit);

  if (!needsClientSideCityMatch) {
    if (options.categories?.length) {
      query = query.in('category', options.categories);
    } else if (options.category) {
      query = query.eq('category', options.category);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[GLAMORA] Error al obtener artículos:', error.message);
    throw new Error('No se pudieron cargar los artículos.');
  }

  const rows = (data ?? []) as Article[];

  if (!needsClientSideCityMatch) {
    return rows;
  }

  const targetCity = options.city ? normalizeEditorialToken(options.city) : null;
  const targetOrCity = options.orCity ? normalizeEditorialToken(options.orCity) : null;
  const targetCategories = (
    options.categories?.length
      ? options.categories
      : options.category
        ? [options.category]
        : []
  ).map((item) => normalizeEditorialToken(item));
  const socialCategoryTokens = ['social', 'sociales', 'society'];

  return rows
    .filter((article) => {
      const articleCity = normalizeEditorialToken(article.city);
      const articleCategory = normalizeEditorialToken(article.category);

      if (options.social === true) {
        const isSocialMatch =
          Boolean(article.is_social) || socialCategoryTokens.includes(articleCategory);
        if (!isSocialMatch) return false;
      }

      if (targetCity) {
        return articleCity === targetCity;
      }

      if (targetCategories.length > 0 || targetOrCity) {
        const matchesCategory =
          targetCategories.length > 0 && targetCategories.includes(articleCategory);
        const matchesOrCity =
          Boolean(targetOrCity) && articleCity === targetOrCity;
        return matchesCategory || matchesOrCity;
      }

      return true;
    })
    .slice(0, limit);
}

export async function getArticle(slug: string): Promise<Article | null> {
  const db = await supabaseServer();

  if (!db) {
    return demoArticles.find((article) => article.slug === slug) ?? null;
  }

  const { data, error } = await db
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())
    .maybeSingle();

  if (error) {
    console.error('[GLAMORA] Error al obtener el artículo:', error.message);
    throw new Error('No se pudo cargar el artículo.');
  }

  return (data as Article | null) ?? null;
}

export type CoverArticleResult = {
  article: Article | null;
  unavailable: boolean;
};

export async function getCoverArticle(): Promise<CoverArticleResult> {
  try {
    const db = await supabaseServer();

    if (!db) {
      return { article: null, unavailable: true };
    }

    const { data: manualCover, error: manualCoverError } = await db
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .eq('is_cover', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (manualCoverError) {
      console.error('[GLAMORA] Error al obtener la portada manual:', manualCoverError.message);
      return { article: null, unavailable: true };
    }

    if (manualCover) {
      return { article: manualCover as Article, unavailable: false };
    }

    const { data: latestArticle, error: latestArticleError } = await db
      .from('articles')
      .select('*')
      .eq('is_published', true)
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestArticleError) {
      console.error('[GLAMORA] Error al obtener la portada automática:', latestArticleError.message);
      return { article: null, unavailable: true };
    }

    return {
      article: chooseCoverArticle(
        manualCover as Article | null,
        (latestArticle as Article | null) ?? null,
      ),
      unavailable: false,
    };
  } catch {
    console.error('[GLAMORA] No se pudo conectar para obtener la portada.');
    return { article: null, unavailable: true };
  }
}
