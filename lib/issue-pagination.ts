import { extractEditorialVideo } from './editorial-video';
import type {
  IssueDesignConfig,
  SpreadLayoutStyle,
  FascicleKind,
  FashionWishlistItem,
  ArticleSponsorTag,
  MastheadStaffConfig,
} from './issue-design-types';

export type IssueArticleItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body?: string | null;
  category?: string | null;
  city?: string | null;
  author?: string | null;
  cover_image?: string | null;
  gallery_images?: string[] | null;
  event_name?: string | null;
  venue?: string | null;
  people_tags?: string[] | null;
};

export type EditorialBlock =
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'inline-image'; url: string; caption: string };

export type EditorialPhoto = {
  url: string;
  caption: string;
  source: 'cover' | 'gallery' | 'inline';
};

export function getCleanImageUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (trimmed.includes(' | ')) return trimmed.split(' | ')[0].trim();
  if (trimmed.includes('|')) return trimmed.split('|')[0].trim();
  return trimmed;
}

export function getPhotoCaption(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  if (trimmed.includes(' | ')) return trimmed.split(' | ').slice(1).join(' | ').trim();
  if (trimmed.includes('|')) return trimmed.split('|').slice(1).join('|').trim();
  return '';
}

/**
 * Parsea el texto del artículo en bloques editoriales estructurados, extrayendo
 * de forma exhaustiva intertítulos, citas, párrafos e imágenes intercaladas [IMAGEN:...].
 */
export function parseEditorialBlocks(rawBody: string | null | undefined): {
  blocks: EditorialBlock[];
  inlinePhotos: EditorialPhoto[];
} {
  if (!rawBody) return { blocks: [], inlinePhotos: [] };

  const clean = extractEditorialVideo(rawBody).cleanBody.trim();
  if (!clean) return { blocks: [], inlinePhotos: [] };

  // Separar respetando bloques [IMAGEN: ...] tanto aislados como embebidos
  const rawChunks = clean
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean);

  const blocks: EditorialBlock[] = [];
  const inlinePhotos: EditorialPhoto[] = [];

  for (const chunk of rawChunks) {
    // 1. Imagen intercalada [IMAGEN: url | pie]
    const inlineMatch = chunk.match(/^\[IMAGEN:\s*([^|\]]+?)(?:\s*\|\s*([^\]]*))?\]$/i);
    if (inlineMatch) {
      const url = getCleanImageUrl(inlineMatch[1]);
      const caption = (inlineMatch[2] || '').trim();
      if (url) {
        blocks.push({ type: 'inline-image', url, caption });
        inlinePhotos.push({ url, caption, source: 'inline' });
      }
      continue;
    }

    // 2. Intertítulo
    if (/^#{1,3}\s+/.test(chunk)) {
      blocks.push({
        type: 'heading',
        text: chunk.replace(/^#{1,3}\s+/, '').trim(),
      });
      continue;
    }

    // 3. Cita en bloque o frase encomillada destacada
    if (/^>\s+/.test(chunk) || (chunk.startsWith('“') && chunk.endsWith('”') && chunk.length < 260)) {
      blocks.push({
        type: 'quote',
        text: chunk.replace(/^>\s+/, '').replace(/^“|”$/g, '').trim(),
      });
      continue;
    }

    // 4. Si el chunk contiene un [IMAGEN: ...] dentro de un párrafo, subdividirlo
    if (/\[IMAGEN:[^\]]+\]/i.test(chunk)) {
      const subparts = chunk.split(/(\[IMAGEN:[^\]]+\])/gi);
      for (const sub of subparts) {
        const subTrim = sub.trim();
        if (!subTrim) continue;
        const subMatch = subTrim.match(/^\[IMAGEN:\s*([^|\]]+?)(?:\s*\|\s*([^\]]*))?\]$/i);
        if (subMatch) {
          const url = getCleanImageUrl(subMatch[1]);
          const caption = (subMatch[2] || '').trim();
          if (url) {
            blocks.push({ type: 'inline-image', url, caption });
            inlinePhotos.push({ url, caption, source: 'inline' });
          }
        } else {
          blocks.push({ type: 'paragraph', text: subTrim });
        }
      }
      continue;
    }

    // 5. Párrafo ordinario
    blocks.push({
      type: 'paragraph',
      text: chunk,
    });
  }

  return { blocks, inlinePhotos };
}

/**
 * Calcula el peso tipográfico de un bloque para determinar su ocupación vertical en página.
 */
function getBlockWeight(block: EditorialBlock): number {
  if (block.type === 'heading') {
    return block.text.length + 90;
  }
  if (block.type === 'quote') {
    return Math.round(block.text.length * 1.35) + 80;
  }
  if (block.type === 'inline-image') {
    return 260;
  }
  return block.text.length;
}

export type ArticleSpreadDescriptor = {
  spreadIndexInArticle: number;
  totalSpreadsInArticle: number;
  leftPageNumber: number;
  rightPageNumber: number;
  isFirstSpread: boolean;
  isLastSpread: boolean;
  leftKind: 'hero-layout' | 'gallery-single' | 'gallery-duo' | 'quote-plate';
  leftPhotos: EditorialPhoto[];
  rightKind: 'opening' | 'continuation' | 'conclusion';
  rightBlocks: EditorialBlock[];
  hasMoreAfter: boolean;
  fascicleKind?: FascicleKind;
  sponsorTag?: ArticleSponsorTag;
  wishlistItems?: FashionWishlistItem[];
};

export type ArticleSpreadPlan = {
  article: IssueArticleItem;
  startPage: number;
  endPage: number;
  totalSpreads: number;
  totalIndividualPages: number;
  pageRangeLabel: string;
  spreads: ArticleSpreadDescriptor[];
  allPhotos: EditorialPhoto[];
  fascicleKind?: FascicleKind;
  sponsorTag?: ArticleSponsorTag;
  wishlistItems?: FashionWishlistItem[];
};

export type PageSlotDefinition =
  | { type: 'cover'; pageNumber: number }
  | { type: 'letter'; pageNumber: number }
  | { type: 'toc'; pageNumber: number }
  | { type: 'sponsor'; pageNumber: number; mastheadStaff?: MastheadStaffConfig }
  | {
      type: 'article-page';
      pageNumber: number;
      slot: 'left' | 'right';
      article: IssueArticleItem;
      spreadDescriptor: ArticleSpreadDescriptor;
      articlePlan: ArticleSpreadPlan;
    }
  | { type: 'colophon'; pageNumber: number }
  | { type: 'backcover'; pageNumber: number };

export type IssuePaginationPlan = {
  totalPages: number;
  totalSpreads: number;
  pages: PageSlotDefinition[];
  articlePlans: ArticleSpreadPlan[];
  articlePageMap: Record<
    string,
    {
      startPage: number;
      endPage: number;
      totalIndividualPages: number;
      totalSpreads: number;
      pageRangeLabel: string;
    }
  >;
};

// Capacidad tipográfica de lectura en página (unidades de peso visual)
// En pliego de apertura (Página 1), cabecera, bajada y excerpt toman ~40% del alto disponible.
const MAX_OPENING_WEIGHT = 650;
const MAX_OPENING_BLOCKS = 3;

// En pliegos de continuación (Página 2+), la crónica aprovecha toda la doble columna.
const MAX_CONTINUATION_WEIGHT = 1250;
const MAX_CONTINUATION_BLOCKS = 5;

/**
 * Empaqueta bloques editoriales en páginas con control real de desbordamiento (Bin-Packing).
 */
export function partitionBlocksIntoPages(blocks: EditorialBlock[]): EditorialBlock[][] {
  if (blocks.length === 0) return [[]];

  const pages: EditorialBlock[][] = [];
  let currentGroup: EditorialBlock[] = [];
  let currentWeight = 0;
  let isOpening = true;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const weight = getBlockWeight(block);
    const maxWeight = isOpening ? MAX_OPENING_WEIGHT : MAX_CONTINUATION_WEIGHT;
    const maxBlocks = isOpening ? MAX_OPENING_BLOCKS : MAX_CONTINUATION_BLOCKS;

    // Si ya tenemos al menos un bloque y añadir el siguiente excede la capacidad en peso O cantidad:
    if (
      currentGroup.length > 0 &&
      (currentGroup.length >= maxBlocks || currentWeight + weight > maxWeight)
    ) {
      pages.push(currentGroup);
      currentGroup = [block];
      currentWeight = weight;
      isOpening = false;
    } else {
      currentGroup.push(block);
      currentWeight += weight;
    }
  }

  if (currentGroup.length > 0) {
    pages.push(currentGroup);
  }

  return pages;
}

/**
 * Construye el plan de paginación de la revista garantizando:
 * 1. Cero texto truncado (bin-packing dinámico sin límite superior).
 * 2. Cero fotografías perdidas (todas las imágenes de galería e inline se distribuyen en pliegos).
 * 3. Exactitud en el sumario y rangos de página.
 */
export function buildIssuePaginationPlan(
  articles: IssueArticleItem[],
  design?: IssueDesignConfig
): IssuePaginationPlan {
  const pages: PageSlotDefinition[] = [];
  const articlePlans: ArticleSpreadPlan[] = [];
  const articlePageMap: Record<
    string,
    {
      startPage: number;
      endPage: number;
      totalIndividualPages: number;
      totalSpreads: number;
      pageRangeLabel: string;
    }
  > = {};

  // Páginas preliminares fijas
  pages.push({ type: 'cover', pageNumber: 0 });
  pages.push({ type: 'letter', pageNumber: 1 });
  pages.push({ type: 'toc', pageNumber: 2 });
  pages.push({
    type: 'sponsor',
    pageNumber: 3,
    mastheadStaff: design?.mastheadStaff,
  });

  let currentPage = 4;

  for (const art of articles) {
    const { blocks, inlinePhotos } = parseEditorialBlocks(art.body);

    // Detección de Fascículo (Moda/Atelier, Sociedad/Galas, Diálogos/Entrevistas, Gourmet/Lifestyle)
    const rawFascicle =
      design?.articleFascicles?.[art.id] ||
      (art.slug ? design?.articleFascicles?.[art.slug] : undefined);

    let fascicleKind: FascicleKind = 'moda-atelier';
    if (rawFascicle) {
      fascicleKind = rawFascicle;
    } else {
      const cat = (art.category || '').toLowerCase();
      if (cat.includes('soc') || cat.includes('gal') || cat.includes('fies') || cat.includes('event')) {
        fascicleKind = 'sociedad-gala';
      } else if (cat.includes('entrev') || cat.includes('dial') || cat.includes('perf')) {
        fascicleKind = 'dialogos-entrevista';
      } else if (cat.includes('gour') || cat.includes('gast') || cat.includes('rest') || cat.includes('vino')) {
        fascicleKind = 'gourmet-lifestyle';
      } else {
        fascicleKind = 'moda-atelier';
      }
    }

    const sponsorTag =
      design?.articleSponsorTags?.[art.id] ||
      (art.slug ? design?.articleSponsorTags?.[art.slug] : undefined);

    const wishlistItems =
      design?.articleWishlistItems?.[art.id] ||
      (art.slug ? design?.articleWishlistItems?.[art.slug] : undefined) ||
      [];

    // 1. Recolección integral de todas las fotografías disponibles
    const allPhotos: EditorialPhoto[] = [];

    const overrideCover = design?.articleCoverOverrides?.[art.id];
    const cleanCover = getCleanImageUrl(overrideCover || art.cover_image);
    if (cleanCover) {
      allPhotos.push({
        url: cleanCover,
        caption: 'Portada oficial',
        source: 'cover',
      });
    }

    const rawGallery = art.gallery_images || [];
    rawGallery.forEach((item, gIdx) => {
      const url = getCleanImageUrl(item);
      const caption = getPhotoCaption(item) || `Detalle editorial · ${String(gIdx + 1).padStart(2, '0')}`;
      if (url && !allPhotos.some((p) => p.url === url)) {
        allPhotos.push({ url, caption, source: 'gallery' });
      }
    });

    inlinePhotos.forEach((img) => {
      if (!allPhotos.some((p) => p.url === img.url)) {
        allPhotos.push(img);
      }
    });

    // Foto de respaldo si el artículo no tiene imágenes
    if (allPhotos.length === 0) {
      allPhotos.push({
        url: '/brand/glamora-mark.png',
        caption: 'GLAMORA EDITORIAL',
        source: 'cover',
      });
    }

    // 2. Partición de bloques según capacidad física
    const blockPages = partitionBlocksIntoPages(blocks);

    // 3. Cantidad de pliegos necesarios según texto y galería
    const textSpreadCount = Math.max(1, blockPages.length);

    // Si hay fotos de galería sobrantes (más allá de la foto 1 de portada),
    // cada pliego de continuación puede acoger hasta 2 fotos (gallery-duo o gallery-single)
    const photosForSubsequentSpreads = Math.max(0, allPhotos.length - 1);
    const photoSpreadCount = 1 + Math.ceil(photosForSubsequentSpreads / 2);

    const spreadCount = Math.max(textSpreadCount, photoSpreadCount);

    const startPage = currentPage;
    const totalIndividualPages = spreadCount * 2;
    const endPage = startPage + totalIndividualPages - 1;

    const startFormatted = String(startPage).padStart(2, '0');
    const endFormatted = String(endPage).padStart(2, '0');
    const pageRangeLabel =
      totalIndividualPages === 2
        ? `PÁG. ${startFormatted}–${String(startPage + 1).padStart(2, '0')}`
        : `PÁG. ${startFormatted}–${endFormatted}`;

    const spreads: ArticleSpreadDescriptor[] = [];

    // Distribución de fotos sobrantes para pliegos de continuación
    let remainingPhotos = allPhotos.slice(1);

    for (let sIdx = 0; sIdx < spreadCount; sIdx++) {
      const isFirst = sIdx === 0;
      const isLast = sIdx === spreadCount - 1;
      const leftPageNum = startPage + sIdx * 2;
      const rightPageNum = leftPageNum + 1;

      // Asignar bloques de texto a este pliego
      const rightBlocks = blockPages[sIdx] || [];

      let leftKind: 'hero-layout' | 'gallery-single' | 'gallery-duo' | 'quote-plate' = 'hero-layout';
      let leftPhotosForSpread: EditorialPhoto[] = [];

      if (isFirst) {
        leftKind = 'hero-layout';
        leftPhotosForSpread = [allPhotos[0]];
      } else {
        if (remainingPhotos.length >= 2) {
          leftKind = 'gallery-duo';
          leftPhotosForSpread = [remainingPhotos[0], remainingPhotos[1]];
          remainingPhotos = remainingPhotos.slice(2);
        } else if (remainingPhotos.length === 1) {
          leftKind = 'gallery-single';
          leftPhotosForSpread = [remainingPhotos[0]];
          remainingPhotos = [];
        } else {
          leftKind = 'quote-plate';
          leftPhotosForSpread = [allPhotos[0]];
        }
      }

      const spreadDescriptor: ArticleSpreadDescriptor = {
        spreadIndexInArticle: sIdx,
        totalSpreadsInArticle: spreadCount,
        leftPageNumber: leftPageNum,
        rightPageNumber: rightPageNum,
        isFirstSpread: isFirst,
        isLastSpread: isLast,
        leftKind,
        leftPhotos: leftPhotosForSpread,
        rightKind: isFirst ? 'opening' : isLast ? 'conclusion' : 'continuation',
        rightBlocks,
        hasMoreAfter: !isLast,
        fascicleKind,
        sponsorTag,
        wishlistItems,
      };

      spreads.push(spreadDescriptor);
    }

    const plan: ArticleSpreadPlan = {
      article: art,
      startPage,
      endPage,
      totalSpreads: spreadCount,
      totalIndividualPages,
      pageRangeLabel,
      spreads,
      allPhotos,
      fascicleKind,
      sponsorTag,
      wishlistItems,
    };

    articlePlans.push(plan);

    articlePageMap[art.id] = {
      startPage,
      endPage,
      totalIndividualPages,
      totalSpreads: spreadCount,
      pageRangeLabel,
    };

    if (art.slug) {
      articlePageMap[art.slug] = {
        startPage,
        endPage,
        totalIndividualPages,
        totalSpreads: spreadCount,
        pageRangeLabel,
      };
    }

    // Insertar en secuencia de páginas
    spreads.forEach((spread) => {
      pages.push({
        type: 'article-page',
        pageNumber: spread.leftPageNumber,
        slot: 'left',
        article: art,
        spreadDescriptor: spread,
        articlePlan: plan,
      });
      pages.push({
        type: 'article-page',
        pageNumber: spread.rightPageNumber,
        slot: 'right',
        article: art,
        spreadDescriptor: spread,
        articlePlan: plan,
      });
    });

    currentPage += totalIndividualPages;
  }

  // Páginas finales de cierre
  pages.push({ type: 'colophon', pageNumber: currentPage });
  pages.push({ type: 'backcover', pageNumber: currentPage + 1 });
  currentPage += 2;

  const totalPages = currentPage;
  const totalSpreads = Math.ceil(totalPages / 2);

  return {
    totalPages,
    totalSpreads,
    pages,
    articlePlans,
    articlePageMap,
  };
}
