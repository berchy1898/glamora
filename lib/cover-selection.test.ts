import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chooseCoverArticle,
  CoverSelectionError,
  excludeCoverFromRecent,
  selectManualCover,
  type CoverArticle,
  type CoverSelectionRepository,
} from './cover-selection';

const now = new Date('2026-11-02T12:00:00.000Z');
const current = { id: 'current', is_published: true, published_at: '2026-11-01T12:00:00.000Z' };
const latest = { id: 'latest', is_published: true, published_at: '2026-11-02T11:00:00.000Z' };
const next = { id: 'next', is_published: true, published_at: '2026-11-02T10:00:00.000Z' };

function createRepository(options: {
  initial?: string[];
  clearError?: boolean;
  setError?: boolean;
  commitOnSetError?: boolean;
} = {}) {
  const state = new Set(options.initial || []);
  let setCalls = 0;
  const articles = new Map<string, CoverArticle>([
    [current.id, current],
    [latest.id, latest],
    [next.id, next],
    ['draft', { id: 'draft', is_published: false, published_at: null }],
    ['scheduled', { id: 'scheduled', is_published: true, published_at: '2026-11-03T12:00:00.000Z' }],
  ]);

  const repository: CoverSelectionRepository = {
    async findEligibleArticle(id) {
      const article = articles.get(id);
      return {
        data: article && article.is_published && article.published_at && Date.parse(article.published_at) <= now.getTime()
          ? article
          : null,
        error: null,
      };
    },
    async getManualCoverIds() {
      return { data: [...state], error: null };
    },
    async clearManualCovers() {
      if (options.clearError) return { error: 'Fallo al desmarcar' };
      state.clear();
      return { error: null };
    },
    async setManualCover(id) {
      setCalls += 1;
      if (options.setError) {
        if (options.commitOnSetError) state.add(id);
        return { affected: false, error: 'Respuesta interrumpida' };
      }
      state.add(id);
      return { affected: true, error: null };
    },
    async restoreManualCovers(ids) {
      ids.forEach((id) => state.add(id));
      return { data: [...ids], error: null };
    },
  };

  return { repository, state, get setCalls() { return setCalls; } };
}

test('selecciona una publicación vigente y deja una única portada manual', async () => {
  const fake = createRepository();
  const result = await selectManualCover(latest.id, fake.repository, now);

  assert.equal(result.changed, true);
  assert.deepEqual([...fake.state], [latest.id]);
});

test('sustituye la portada y restaura la anterior si falla la segunda operación', async () => {
  const fake = createRepository({ initial: [current.id], setError: true });

  await assert.rejects(
    selectManualCover(latest.id, fake.repository, now),
    (error: unknown) => error instanceof CoverSelectionError && error.message.includes('Se restauró y verificó'),
  );
  assert.deepEqual([...fake.state], [current.id]);
});

test('un fallo al retirar la portada conserva la selección actual', async () => {
  const fake = createRepository({ initial: [current.id], clearError: true });

  await assert.rejects(
    selectManualCover(latest.id, fake.repository, now),
    (error: unknown) => error instanceof CoverSelectionError && error.message.includes('sigue seleccionada'),
  );
  assert.deepEqual([...fake.state], [current.id]);
  assert.equal(fake.setCalls, 0);
});

test('reconoce una selección confirmada pese a una respuesta de red incierta', async () => {
  const fake = createRepository({ initial: [current.id], setError: true, commitOnSetError: true });
  const result = await selectManualCover(latest.id, fake.repository, now);

  assert.equal(result.confirmedAfterUncertainResponse, true);
  assert.deepEqual([...fake.state], [latest.id]);
});

test('si no había portada y falla la selección, indica que opera el fallback público', async () => {
  const fake = createRepository({ setError: true });

  await assert.rejects(
    selectManualCover(latest.id, fake.repository, now),
    (error: unknown) => error instanceof CoverSelectionError && error.message.includes('artículo publicado más reciente'),
  );
  assert.equal(fake.state.size, 0);
});

test('rechaza borradores y publicaciones programadas como portada principal', async () => {
  const fake = createRepository({ initial: [current.id] });

  await assert.rejects(selectManualCover('draft', fake.repository, now), CoverSelectionError);
  await assert.rejects(selectManualCover('scheduled', fake.repository, now), CoverSelectionError);
  assert.deepEqual([...fake.state], [current.id]);
});

test('la portada manual tiene prioridad y, si falta, se usa la publicación más reciente', () => {
  assert.equal(chooseCoverArticle(current, latest), current);
  assert.equal(chooseCoverArticle(null, latest), latest);
  assert.equal(chooseCoverArticle(null, null), null);
});

test('la historia principal se excluye de la lista de recientes sin alterar el resto', () => {
  const recent = [latest, next, current];
  assert.deepEqual(excludeCoverFromRecent(recent, latest), [next, current]);
  assert.deepEqual(excludeCoverFromRecent(recent, null), recent);
});
