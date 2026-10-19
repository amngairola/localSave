import type { Snippet, SnippetInput, StorageUsage } from "../types/snippet";
import { sanitizeSnippet } from "../utils/validateImport";

// Only this key is ever written/removed, so other extension data is never touched.
const KEY = "snipvault.snippets.v1";
const DEFAULT_QUOTA = 10 * 1024 * 1024;

const hasChrome = typeof chrome !== "undefined" && !!chrome.storage?.local;

// Fallback for previewing the popup outside of Chrome (dev server only).
const area = {
  async get(): Promise<unknown> {
    if (hasChrome) return (await chrome.storage.local.get(KEY))[KEY];
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : undefined;
  },
  async set(list: Snippet[]) {
    if (hasChrome) return chrome.storage.local.set({ [KEY]: list });
    localStorage.setItem(KEY, JSON.stringify(list));
  },
  async remove() {
    if (hasChrome) return chrome.storage.local.remove(KEY);
    localStorage.removeItem(KEY);
  },
};

// Serialize all read-modify-write operations so rapid changes never overwrite newer data.
let queue: Promise<unknown> = Promise.resolve();
function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

function friendly(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/quota/i.test(msg)) return new Error("Storage is full. Delete some snippets and try again.");
  return new Error(`Storage error: ${msg}`);
}

async function read(): Promise<Snippet[]> {
  try {
    const raw = await area.get();
    if (!Array.isArray(raw)) return [];
    return raw.map(sanitizeSnippet).filter((s): s is Snippet => s !== null);
  } catch {
    return [];
  }
}

async function write(list: Snippet[]) {
  try {
    await area.set(list);
  } catch (e) {
    throw friendly(e);
  }
}

export const sortSnippets = (l: Snippet[]) => [...l].sort((a, b) => b.updatedAt - a.updatedAt);

export const loadSnippets = () => locked(async () => sortSnippets(await read()));

export const createSnippet = (input: SnippetInput) =>
  locked(async () => {
    const now = Date.now();
    const s: Snippet = { id: crypto.randomUUID(), ...input, title: input.title.trim(), createdAt: now, updatedAt: now };
    const list = [s, ...(await read())];
    await write(list);
    return sortSnippets(list);
  });

export const updateSnippet = (id: string, input: SnippetInput) =>
  locked(async () => {
    const list = await read();
    const i = list.findIndex((s) => s.id === id);
    if (i < 0) throw new Error("Snippet no longer exists.");
    list[i] = { ...list[i]!, ...input, title: input.title.trim(), updatedAt: Date.now() };
    await write(list);
    return sortSnippets(list);
  });

export const deleteSnippet = (id: string) =>
  locked(async () => {
    const list = (await read()).filter((s) => s.id !== id);
    await write(list);
    return sortSnippets(list);
  });

export const clearSnippets = () =>
  locked(async () => {
    try {
      await area.remove();
    } catch (e) {
      throw friendly(e);
    }
    return [] as Snippet[];
  });

/** Merges imported snippets. Duplicate IDs get a fresh ID so nothing is overwritten. */
export const importSnippets = (incoming: Snippet[]) =>
  locked(async () => {
    const list = await read();
    const ids = new Set(list.map((s) => s.id));
    let renamed = 0;
    for (const s of incoming) {
      if (ids.has(s.id)) {
        s.id = crypto.randomUUID();
        renamed++;
      }
      ids.add(s.id);
      list.push(s);
    }
    await write(list);
    return { list: sortSnippets(list), renamed };
  });

export async function getUsage(): Promise<StorageUsage> {
  let bytes = 0;
  let quota = DEFAULT_QUOTA;
  if (hasChrome) {
    bytes = await chrome.storage.local.getBytesInUse(null);
    quota = chrome.storage.local.QUOTA_BYTES || DEFAULT_QUOTA;
  } else {
    bytes = new Blob([localStorage.getItem(KEY) ?? ""]).size;
  }
  return { bytes, quota, percent: Math.min(100, (bytes / quota) * 100) };
}
