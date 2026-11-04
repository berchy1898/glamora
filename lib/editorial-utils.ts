export type EditorialStatus = 'draft' | 'review' | 'approved' | 'scheduled' | 'published';

export type CoverageStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'completed'
  | 'article_created'
  | 'in_review'
  | 'published';

export type PersistedCoverageStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'completed'
  | 'article_created';

export const EDITORIAL_STATUS_LABELS: Record<EditorialStatus, string> = {
  draft: 'BORRADOR',
  review: 'EN REVISIÓN',
  approved: 'APROBADO',
  scheduled: 'PROGRAMADO',
  published: 'PUBLICADO',
};

export const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  pending: 'POR CONFIRMAR',
  confirmed: 'CONFIRMADA',
  preparing: 'EN PRODUCCIÓN',
  completed: 'REALIZADA',
  article_created: 'ARTÍCULO CREADO',
  in_review: 'EN REVISIÓN',
  published: 'PUBLICADA',
};

const editorialStatuses = new Set<EditorialStatus>([
  'draft',
  'review',
  'approved',
  'scheduled',
  'published',
]);

export function getEditorialStatus(article: {
  editorial_status?: string | null;
  is_published?: boolean;
  published_at?: string | null;
}): EditorialStatus {
  if (
    article.editorial_status === 'scheduled' &&
    article.is_published &&
    article.published_at &&
    new Date(article.published_at) <= new Date()
  ) {
    return 'published';
  }

  if (article.editorial_status && editorialStatuses.has(article.editorial_status as EditorialStatus)) {
    return article.editorial_status as EditorialStatus;
  }

  if (article.is_published && article.published_at) {
    return new Date(article.published_at) > new Date() ? 'scheduled' : 'published';
  }

  return 'draft';
}

export function getEditorialStatusLabel(status: string | null | undefined): string {
  return status && editorialStatuses.has(status as EditorialStatus)
    ? EDITORIAL_STATUS_LABELS[status as EditorialStatus]
    : EDITORIAL_STATUS_LABELS.draft;
}

export function getCoverageStatusLabel(status: string | null | undefined): string {
  return status && Object.prototype.hasOwnProperty.call(COVERAGE_STATUS_LABELS, status)
    ? COVERAGE_STATUS_LABELS[status as CoverageStatus]
    : 'ESTADO POR REVISAR';
}

export function splitEditorialParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function dateKeyFromParts(year: string, month: string, day: string): string {
  return `${year}-${month}-${day}`;
}

export function getBoliviaDateKey(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return dateKeyFromParts(values.year, values.month, values.day);
}

export function getCalendarDateKey(value: string | null | undefined): string | null {
  if (!value) return null;

  // A date-only value is a calendar day, not a UTC instant.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
      return null;
    }
    return value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : getBoliviaDateKey(date);
}

export function getBoliviaCalendarDate(date = new Date()): Date {
  const [year, month, day] = getBoliviaDateKey(date).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatBoliviaCalendarDate(value: string, options: Intl.DateTimeFormatOptions): string {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  return new Intl.DateTimeFormat('es-BO', {
    ...options,
    timeZone: 'America/La_Paz',
  }).format(date);
}

export function formatBoliviaCalendarMonth(date: Date): string {
  const stableDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 15, 12));
  return new Intl.DateTimeFormat('es-BO', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/La_Paz',
  }).format(stableDate);
}

export function getLocalCalendarDateKey(date: Date): string {
  return dateKeyFromParts(
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  );
}
