import { CATEGORIES, TITLE_MAX, type Category, type Snippet } from "../types/snippet";

export function sanitizeSnippet(raw: unknown): Snippet | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.title !== "string" || typeof r.content !== "string") return null;
  const title = r.title.trim().slice(0, TITLE_MAX);
  if (!title || r.content.trim() === "") return null;
  const now = Date.now();
  const category: Category = CATEGORIES.includes(r.category as Category)
    ? (r.category as Category)
    : "General";
  const createdAt = typeof r.createdAt === "number" && r.createdAt > 0 ? r.createdAt : now;
  const updatedAt = typeof r.updatedAt === "number" && r.updatedAt > 0 ? r.updatedAt : createdAt;
  return {
    id: typeof r.id === "string" && r.id ? r.id : crypto.randomUUID(),
    title,
    content: r.content,
    category,
    createdAt,
    updatedAt,
  };
}

export interface ImportResult {
  valid: Snippet[];
  invalid: number;
}

export function validateImport(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON.");
  }
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { snippets?: unknown }).snippets)
      ? (data as { snippets: unknown[] }).snippets
      : null;
  if (!list) throw new Error("No snippets found in this file.");
  const valid: Snippet[] = [];
  let invalid = 0;
  for (const item of list) {
    const s = sanitizeSnippet(item);
    if (s) valid.push(s);
    else invalid++;
  }
  return { valid, invalid };
}
