import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CoverageDraftLinkError,
  ensureCoverageDraftLink,
  type CoverageDraftArticle,
  type CoverageDraftPayload,
  type CoverageDraftRepository,
} from './coverage-draft-link';

const input = {
  coverageId: 'a84f1bd0-1e21-45aa-9cef-23d5c4178a91',
  title: 'Gala GLAMORA',
  eventDate: '2026-11-02',
  category: 'Social',
  city: 'Cochabamba',
  venue: 'Casa editorial',
};

function createRepository(options: { createError?: boolean; linkError?: boolean } = {}) {
  const articles = new Map<string, CoverageDraftArticle>();
  const links = new Map<string, string>();
  let createCount = 0;
  let linkError = options.linkError || false;

  const repository: CoverageDraftRepository = {
    async findBySlug(slug) {
      return { data: articles.get(slug) || null, error: null };
    },
    async findLegacyCandidates(idSuffix) {
      return {
        data: [...articles.values()].filter((article) => article.slug.endsWith(`-${idSuffix}`)),
        error: null,
      };
    },
    async createDraft(draft: CoverageDraftPayload) {
      createCount += 1;
      const article: CoverageDraftArticle = {
        slug: draft.slug,
        event_name: draft.event_name,
        event_date: draft.event_date,
        is_published: false,
      };
      // Simula timeout ambiguo: el servidor guardó el borrador, pero el cliente recibió error.
      articles.set(draft.slug, article);
      return { error: options.createError ? 'Respuesta de red interrumpida' : null };
    },
    async saveCoverageLink(coverageId, slug) {
      if (linkError) return { error: 'No se pudo guardar el vínculo' };
      links.set(coverageId, slug);
      return { error: null };
    },
  };

  return {
    repository,
    articles,
    links,
    get createCount() { return createCount; },
    retryLink: async () => { linkError = false; },
  };
}

test('crea un borrador con slug estable y lo vincula en éxito', async () => {
  const fake = createRepository();
  const result = await ensureCoverageDraftLink(input, fake.repository);

  assert.equal(result.created, true);
  assert.equal(result.slug, `cobertura-${input.coverageId.replace(/-/g, '')}`);
  assert.equal(fake.links.get(input.coverageId), result.slug);
  assert.equal(fake.createCount, 1);
});

test('si el alta devuelve error no intenta guardar el vínculo', async () => {
  const fake = createRepository({ createError: true });

  await assert.rejects(
    ensureCoverageDraftLink(input, fake.repository),
    (error: unknown) => error instanceof CoverageDraftLinkError && error.stage === 'create',
  );
  assert.equal(fake.links.size, 0);
});

test('un reintento tras respuesta ambigua reutiliza el borrador existente', async () => {
  const fake = createRepository({ createError: true });

  await assert.rejects(ensureCoverageDraftLink(input, fake.repository));
  await fake.retryLink();
  const result = await ensureCoverageDraftLink(input, fake.repository);

  assert.equal(result.created, false);
  assert.equal(fake.createCount, 1);
  assert.equal(fake.links.get(input.coverageId), result.slug);
});

test('un vínculo fallido se puede completar al reintentar sin duplicar el artículo', async () => {
  const fake = createRepository({ linkError: true });

  await assert.rejects(
    ensureCoverageDraftLink(input, fake.repository),
    (error: unknown) => error instanceof CoverageDraftLinkError && error.stage === 'link',
  );
  assert.equal(fake.articles.size, 1);
  assert.equal(fake.links.size, 0);

  await fake.retryLink();
  const result = await ensureCoverageDraftLink({
    ...input,
    title: 'Gala GLAMORA — edición especial',
    eventDate: '2026-11-03',
  }, fake.repository);

  assert.equal(result.created, false);
  assert.equal(fake.createCount, 1);
  assert.equal(fake.articles.size, 1);
  assert.equal(fake.links.get(input.coverageId), result.slug);
});

test('recupera un borrador heredado por identificador de cobertura', async () => {
  const fake = createRepository();
  const suffix = input.coverageId.replace(/-/g, '').slice(-8).toLowerCase();
  const oldSlug = `gala-glamora-${input.eventDate}-${suffix}`;
  fake.articles.set(oldSlug, {
    slug: oldSlug,
    event_name: input.title,
    event_date: input.eventDate,
    is_published: false,
  });

  const result = await ensureCoverageDraftLink(input, fake.repository);

  assert.equal(result.recovered, true);
  assert.equal(result.slug, oldSlug);
  assert.equal(fake.createCount, 0);
  assert.equal(fake.links.get(input.coverageId), oldSlug);
});
