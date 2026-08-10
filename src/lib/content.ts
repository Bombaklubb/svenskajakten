import type { StageContent } from "./types";

/**
 * Loads a stage's exercise content, fetching each file at most once per session.
 *
 * Every module page needs the whole content.json to find its one module, and
 * the file is large (lågstadiet is ~300 kB). Measured without this cache, a
 * pupil opening four modules in a row transferred 1.4 MB — the browser
 * revalidated but the server answered 200 with the full body every time.
 *
 * The promise itself is cached, so pages mounting at the same time share one
 * request instead of racing. A failed load is evicted so a later attempt can
 * retry rather than replaying the rejection forever.
 */
const cache = new Map<string, Promise<StageContent>>();

export function loadStageContent(stageId: string): Promise<StageContent> {
  const cached = cache.get(stageId);
  if (cached) return cached;

  const request = fetch(`/content/${stageId}/content.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`Kunde inte hämta innehåll för ${stageId}`);
      return r.json() as Promise<StageContent>;
    })
    .catch((err) => {
      cache.delete(stageId);
      throw err;
    });

  cache.set(stageId, request);
  return request;
}
