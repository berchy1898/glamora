import assert from 'node:assert/strict';
import test from 'node:test';
import {
  findLinkedArticle,
  resolveProductionStage,
  type ProductionArticle,
  type ProductionCoverage,
} from './production-utils';

const now = new Date('2026-11-02T12:00:00.000Z');
const coverage = (status: string, linked_article_slug: string | null = null): ProductionCoverage => ({
  status,
  linked_article_slug,
});
const article = (overrides: Partial<ProductionArticle> = {}): ProductionArticle => ({
  slug: 'historia-editorial',
  editorial_status: 'draft',
  is_published: false,
  published_at: null,
  ...overrides,
});

test('distribuye correctamente los estados operativos de la cobertura', () => {
  assert.equal(resolveProductionStage(coverage('pending'), null, now), 'planned');
  assert.equal(resolveProductionStage(coverage('confirmed'), null, now), 'confirmed');
  assert.equal(resolveProductionStage(coverage('completed'), null, now), 'completed');
  assert.equal(resolveProductionStage(coverage('preparing'), null, now), 'production');
  assert.equal(resolveProductionStage(coverage('in_review'), null, now), 'review');
  assert.equal(resolveProductionStage(coverage('published'), null, now), 'published');
});

test('distingue borrador, preparación y revisión editorial', () => {
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ editorial_status: 'draft' }), now), 'draft');
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ editorial_status: null }), now), 'production');
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ editorial_status: 'review' }), now), 'review');
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ editorial_status: 'approved' }), now), 'review');
});

test('reconoce published aunque falte published_at y usa fechas futuras para programados', () => {
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ editorial_status: 'published' }), now), 'published');
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ editorial_status: null, is_published: true }), now), 'published');
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ is_published: true, published_at: '2026-11-03T12:00:00.000Z' }), now), 'scheduled');
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ is_published: true, published_at: '2026-11-01T12:00:00.000Z' }), now), 'published');
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ editorial_status: 'scheduled' }), now), 'scheduled');
});

test('envía vínculos rotos y estados desconocidos a revisión de datos', () => {
  assert.equal(resolveProductionStage(coverage('preparing', 'slug-inexistente'), null, now), 'attention');
  assert.equal(resolveProductionStage(coverage('unknown'), null, now), 'attention');
  assert.equal(resolveProductionStage(coverage('preparing', 'historia-editorial'), article({ editorial_status: 'unexpected' }), now), 'attention');
  assert.equal(resolveProductionStage(coverage('article_created'), null, now), 'attention');
});

test('conserva el estado de cobertura como respaldo cuando falta el editorial', () => {
  assert.equal(resolveProductionStage(coverage('confirmed', 'historia-editorial'), article({ editorial_status: null }), now), 'confirmed');
});

test('resuelve artículos por linked_article_slug y detecta el vínculo roto', () => {
  const linked = article();
  const bySlug = new Map([[linked.slug, linked]]);

  assert.equal(findLinkedArticle(coverage('preparing', linked.slug), bySlug), linked);
  assert.equal(findLinkedArticle(coverage('preparing', 'slug-inexistente'), bySlug), null);
  assert.equal(resolveProductionStage(coverage('preparing', 'slug-inexistente'), findLinkedArticle(coverage('preparing', 'slug-inexistente'), bySlug), now), 'attention');
});
