import type { PhotoAdjustments } from './photo-adjustments';

export type FascicleKind =
  | 'moda-atelier'
  | 'sociedad-gala'
  | 'dialogos-entrevista'
  | 'gourmet-lifestyle';

export type FashionWishlistItem = {
  id: string;
  pngUrl: string;
  brand: string;
  item: string;
  price?: string;
  notes?: string;
};

export type MastheadStaffConfig = {
  director?: string;
  artDirection?: string;
  fashionDirector?: string;
  editorialStaff?: string;
  photoContributors?: string;
  cityCorrespondents?: string;
};

export type ArticleSponsorTag = {
  active: boolean;
  brandName: string;
  roleLabel: string;
};

export type SpreadLayoutStyle =
  | 'vogue-classic'
  | 'vogue-asymmetric'
  | 'vogue-collage'
  | 'cinema-bleed'
  | 'social-mosaic'
  | 'editorial-quote'
  | 'wishlist-png'
  | 'the-interview'
  | 'the-taste'
  | 'haute-couture-spread';

export type PhotoEditorialFilter =
  | 'natural'
  | 'warm-gold'
  | 'black-and-white'
  | 'cinema-contrast'
  | 'vintage-35mm'
  | 'nordic-cool';

export type PhotoFocalPoint = 'center' | 'top' | 'bottom';

export type CoverMastheadPalette =
  | 'champagne'
  | 'ivory'
  | 'obsidian'
  | 'burgundy';

export type IssueDesignConfig = {
  mastheadPalette: CoverMastheadPalette;
  editionBadge: string;
  coverHeadline: string;
  coverSubhead: string;
  coverCallouts: string;
  editorLetterTitle: string;
  editorLetterBody: string;
  editorSignature: string;
  sponsorPosition: 'after-toc' | 'mid-issue' | 'back-inside';
  articleLayouts: Record<string, SpreadLayoutStyle>;
  articleFilters?: Record<string, PhotoEditorialFilter>;
  articleFocalPoints?: Record<string, PhotoFocalPoint>;
  articleCoverOverrides?: Record<string, string>;
  articlePhotoAdjustments?: Record<string, PhotoAdjustments>;
  // Estructura de Fascículos y Escaleta Editorial
  articleFascicles?: Record<string, FascicleKind>;
  articleWishlistItems?: Record<string, FashionWishlistItem[]>;
  articleSponsorTags?: Record<string, ArticleSponsorTag>;
  mastheadStaff?: MastheadStaffConfig;
  // Soporte Oficial Flipbook 3D Ultra-HD & PDF
  pdfUrl?: string;
  pdfPages?: string[];
  readerEngine?: '3d-flipbook' | 'article-reader';
};

export const DEFAULT_ISSUE_DESIGN: IssueDesignConfig = {
  mastheadPalette: 'champagne',
  editionBadge: 'THE DIGITAL ISSUE · BOLIVIA',
  coverHeadline: '',
  coverSubhead: '',
  coverCallouts: '',
  editorLetterTitle: 'Mirada propia desde Bolivia hacia el mundo.',
  editorLetterBody:
    'Cada edición digital de GLAMORA reúne las voces, los encuentros sociales, la estética y las propuestas culturales que marcan la temporada en Cochabamba, La Paz, Santa Cruz y el escenario internacional.',
  editorSignature: 'DIRECCIÓN EDITORIAL · GLAMORA',
  sponsorPosition: 'after-toc',
  articleLayouts: {},
  articleFilters: {},
  articleFocalPoints: {},
  articleCoverOverrides: {},
  articlePhotoAdjustments: {},
  articleFascicles: {},
  articleWishlistItems: {},
  articleSponsorTags: {},
  mastheadStaff: {
    director: 'Dirección Editorial GLAMORA',
    artDirection: 'Estudio de Arte & Tipografía Didone',
    fashionDirector: 'Atelier de Moda & Coberturas',
    editorialStaff: 'Crónica, Sociedad y Estilo de Vida',
    photoContributors: 'Fotografía Editorial & Colaboradores de Autor',
    cityCorrespondents: 'Cochabamba · La Paz · Santa Cruz · Internacional',
  },
};
