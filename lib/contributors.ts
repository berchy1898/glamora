export type ContributorProfile = {
  slug: string;
  name: string;
  role: string;
  bio: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
};

export type ArticleEditorialMeta = {
  photographer?: string;
  coverageBy?: string;
  expertHeading?: string;
  expertBio?: string;
};

export const EXPERT_HEADING_PRESETS = [
  'Conoce a nuestra experta',
  'Conoce a nuestro experto',
  'Sobre el entrevistado',
  'Sobre la protagonista',
  'Detrás de la marca',
] as const;

export function slugifyContributorName(name: string | null | undefined): string {
  return (name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
