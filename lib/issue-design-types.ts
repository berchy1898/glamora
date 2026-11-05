export type SpreadLayoutStyle =
  | 'vogue-classic'
  | 'vogue-asymmetric'
  | 'vogue-collage'
  | 'cinema-bleed'
  | 'social-mosaic'
  | 'editorial-quote';

export type PhotoEditorialFilter =
  | 'natural'
  | 'warm-gold'
  | 'black-and-white'
  | 'cinema-contrast';

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
};
