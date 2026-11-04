export type CoverArticle = {
  id: string;
  is_published: boolean;
  published_at: string | null;
};

export type CoverSelectionRepository = {
  findEligibleArticle(id: string, nowIso: string): Promise<{
    data: CoverArticle | null;
    error: string | null;
  }>;
  getManualCoverIds(): Promise<{ data: string[]; error: string | null }>;
  clearManualCovers(): Promise<{ error: string | null }>;
  setManualCover(id: string): Promise<{ affected: boolean; error: string | null }>;
  restoreManualCovers(ids: string[]): Promise<{ data: string[]; error: string | null }>;
};

export class CoverSelectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoverSelectionError';
  }
}

export function isCurrentlyPublished(article: CoverArticle, now = new Date()): boolean {
  if (!article.is_published || !article.published_at) return false;
  const publishedAt = Date.parse(article.published_at);
  return Number.isFinite(publishedAt) && publishedAt <= now.getTime();
}

function sameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

type RecoveryResult =
  | { state: 'target-selected' }
  | { state: 'previous-preserved' }
  | { state: 'previous-restored' }
  | { state: 'no-manual-cover' }
  | { state: 'unverified'; detail: string }
  | { state: 'conflict'; detail: string }
  | { state: 'restore-failed'; detail: string };

async function restorePreviousSelection(
  targetId: string,
  previousIds: string[],
  repository: CoverSelectionRepository,
): Promise<RecoveryResult> {
  const current = await repository.getManualCoverIds();
  if (current.error) return { state: 'unverified', detail: current.error };

  if (sameIds(current.data, [targetId])) return { state: 'target-selected' };
  if (current.data.length === 0 && previousIds.length === 0) return { state: 'no-manual-cover' };
  if (previousIds.length > 0 && sameIds(current.data, previousIds)) return { state: 'previous-preserved' };

  const previousSet = new Set(previousIds);
  const onlyPreviousOrTarget = current.data.every((id) => previousSet.has(id) || id === targetId);
  if (!onlyPreviousOrTarget) {
    return {
      state: 'conflict',
      detail: 'La portada cambió desde otra sesión; se conservó el estado actual para no sobrescribir esa selección.',
    };
  }

  if (previousIds.length === 0) {
    return {
      state: 'conflict',
      detail: 'Se encontró otra portada seleccionada. No se modificó para evitar sobrescribir cambios concurrentes.',
    };
  }

  const clear = await repository.clearManualCovers();
  if (clear.error) return { state: 'restore-failed', detail: clear.error };

  const restore = await repository.restoreManualCovers(previousIds);
  if (restore.error || !sameIds(restore.data, previousIds)) {
    return {
      state: 'restore-failed',
      detail: restore.error || 'La base no confirmó la restauración de la portada anterior.',
    };
  }

  const verified = await repository.getManualCoverIds();
  if (verified.error) return { state: 'unverified', detail: verified.error };
  if (!sameIds(verified.data, previousIds)) {
    return { state: 'restore-failed', detail: 'La verificación posterior no coincide con la portada anterior.' };
  }
  return { state: 'previous-restored' };
}

function failureMessage(operation: string, recovery: RecoveryResult): string {
  if (recovery.state === 'previous-preserved') {
    return `No se pudo ${operation}. La portada anterior sigue seleccionada.`;
  }
  if (recovery.state === 'previous-restored') {
    return `No se pudo ${operation}. Se restauró y verificó la portada anterior.`;
  }
  if (recovery.state === 'no-manual-cover') {
    return `No se pudo ${operation}. No había una portada manual anterior; la portada pública seguirá usando el artículo publicado más reciente.`;
  }
  if (recovery.state === 'target-selected') {
    return 'La respuesta no confirmó la operación, pero la nueva portada aparece seleccionada.';
  }
  if (recovery.state === 'conflict') {
    return `No se pudo confirmar ${operation}. ${recovery.detail}`;
  }
  return `No se pudo confirmar ${operation} ni verificar por completo la recuperación. ${recovery.detail} Revisa la portada en el Dashboard; la página pública conserva su fallback al artículo reciente cuando no encuentra portada manual.`;
}

export async function selectManualCover(
  articleId: string,
  repository: CoverSelectionRepository,
  now = new Date(),
): Promise<{ changed: boolean; confirmedAfterUncertainResponse: boolean }> {
  const targetResult = await repository.findEligibleArticle(articleId, now.toISOString());
  if (targetResult.error) throw new CoverSelectionError(`No se pudo verificar el artículo: ${targetResult.error}`);
  if (!targetResult.data || !isCurrentlyPublished(targetResult.data, now)) {
    throw new CoverSelectionError('Solo se puede seleccionar como portada un artículo publicado y vigente.');
  }

  const previousResult = await repository.getManualCoverIds();
  if (previousResult.error) throw new CoverSelectionError(`No se pudo comprobar la portada actual: ${previousResult.error}`);
  const previousIds = [...new Set(previousResult.data)];
  if (sameIds(previousIds, [articleId])) return { changed: false, confirmedAfterUncertainResponse: false };

  const clearResult = await repository.clearManualCovers();
  if (clearResult.error) {
    const recovery = await restorePreviousSelection(articleId, previousIds, repository);
    if (recovery.state === 'target-selected') return { changed: false, confirmedAfterUncertainResponse: true };
    throw new CoverSelectionError(failureMessage('retirar la portada anterior', recovery));
  }

  const setResult = await repository.setManualCover(articleId);
  if (setResult.error || !setResult.affected) {
    const recovery = await restorePreviousSelection(articleId, previousIds, repository);
    if (recovery.state === 'target-selected') return { changed: true, confirmedAfterUncertainResponse: true };
    throw new CoverSelectionError(failureMessage('seleccionar la nueva portada', recovery));
  }

  const verified = await repository.getManualCoverIds();
  if (verified.error) {
    throw new CoverSelectionError(`La actualización se envió, pero no se pudo verificar la portada seleccionada: ${verified.error}. La portada pública mantiene el fallback al artículo reciente.`);
  }
  if (sameIds(verified.data, [articleId])) return { changed: true, confirmedAfterUncertainResponse: false };

  const recovery = await restorePreviousSelection(articleId, previousIds, repository);
  throw new CoverSelectionError(failureMessage('verificar la selección exclusiva de la portada', recovery));
}

export function chooseCoverArticle<T extends { id: string }>(
  manualCover: T | null,
  latestPublished: T | null,
): T | null {
  return manualCover || latestPublished;
}

export function excludeCoverFromRecent<T extends { id: string }>(
  articles: T[],
  cover: T | null,
): T[] {
  return cover ? articles.filter((article) => article.id !== cover.id) : articles;
}
