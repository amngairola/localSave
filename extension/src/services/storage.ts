import type { Snippet, SnippetInput, StorageUsage } from "../types/snippet";
import { sanitizeSnippet } from "../utils/validateImport";

const KEY = "snipvault.snippets.v1";
const DEFAULT_QUOTA = 10 * 1024 * 1024;
const hasChrome = typeof chrome !== "undefined" && !!chrome.storage?.local;
let cache: Snippet[] | null = null;
let queue: Promise<unknown> = Promise.resolve();
const listeners = new Set<(list: Snippet[]) => void>();
const sortSnippets = (list: Snippet[]) => [...list].sort((a, b) => b.updatedAt - a.updatedAt);
export { sortSnippets };

function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}
function friendly(error: unknown): Error {
  const msg = error instanceof Error ? error.message : String(error);
  return new Error(/quota/i.test(msg) ? "Storage is full. Delete some snippets and try again." : `Storage error: ${msg}`);
}
function decode(raw: unknown): Snippet[] {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) throw new Error("Saved data could not be read. It has not been changed.");
  return sortSnippets(raw.map((value) => {
    const snippet = sanitizeSnippet(value);
    if (!snippet) throw new Error("Saved data contains an invalid item. It has not been changed.");
    return snippet;
  }));
}
function publish(list: Snippet[]) {
  cache = sortSnippets(list);
  listeners.forEach((listener) => listener(cache ?? []));
  return cache;
}
async function read(): Promise<Snippet[]> {
  if (cache) return cache;
  try {
    const raw = hasChrome ? (await chrome.storage.local.get(KEY))[KEY] : JSON.parse(localStorage.getItem(KEY) ?? "null");
    cache = decode(raw);
    return cache;
  } catch (error) { throw friendly(error); }
}
async function write(list: Snippet[]) {
  try {
    if (hasChrome) await chrome.storage.local.set({ [KEY]: list });
    else localStorage.setItem(KEY, JSON.stringify(list));
    return publish(list);
  } catch (error) { throw friendly(error); }
}
export const loadSnippets = () => locked(read);
export function subscribeSnippets(listener: (list: Snippet[]) => void) {
  listeners.add(listener);
  const changed = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== "local" || !changes[KEY]) return;
    // Invalidate before queued work so the next mutation cannot use a stale snapshot.
    cache = null;
    void locked(async () => { try { publish(await read()); } catch { /* Keep the visible collection; next write retries the read. */ } });
  };
  const previewChanged = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    cache = null;
    void locked(async () => { try { publish(await read()); } catch { /* Never replace visible data on failure. */ } });
  };
  if (hasChrome) chrome.storage.onChanged.addListener(changed);
  else window.addEventListener("storage", previewChanged);
  return () => {
    listeners.delete(listener);
    if (hasChrome) chrome.storage.onChanged.removeListener(changed);
    else window.removeEventListener("storage", previewChanged);
  };
}
export const createSnippet = (input: SnippetInput) => locked(async () => {
  const list = await read();
  const now = Date.now();
  return write([{ id: crypto.randomUUID(), ...input, title: input.title.trim(), createdAt: now, updatedAt: now }, ...list]);
});
export const updateSnippet = (id: string, input: SnippetInput) => locked(async () => {
  const list = await read();
  const previous = list.find((snippet) => snippet.id === id);
  if (!previous) throw new Error("Snippet no longer exists.");
  return write(list.map((snippet) => snippet.id === id ? { ...previous, ...input, title: input.title.trim(), updatedAt: Date.now() } : snippet));
});
export const deleteSnippet = (id: string) => locked(async () => write((await read()).filter((snippet) => snippet.id !== id)));
export const clearSnippets = () => locked(async () => {
  await read();
  try {
    if (hasChrome) await chrome.storage.local.remove(KEY);
    else localStorage.removeItem(KEY);
    return publish([]);
  } catch (error) { throw friendly(error); }
});
export const importSnippets = (incoming: Snippet[]) => locked(async () => {
  const list = [...await read()];
  const ids = new Set(list.map((snippet) => snippet.id));
  let renamed = 0;
  for (const snippet of incoming) {
    let id = snippet.id;
    if (ids.has(id)) { do { id = crypto.randomUUID(); } while (ids.has(id)); renamed++; }
    ids.add(id);
    list.push({ ...snippet, id });
  }
  return { list: await write(list), renamed };
});
export async function getUsage(): Promise<StorageUsage> {
  const bytes = hasChrome ? await chrome.storage.local.getBytesInUse(null) : new Blob([localStorage.getItem(KEY) ?? ""]).size;
  const quota = hasChrome ? chrome.storage.local.QUOTA_BYTES || DEFAULT_QUOTA : DEFAULT_QUOTA;
  return { bytes, quota, percent: Math.min(100, bytes / quota * 100) };
}
