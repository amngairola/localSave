import { beforeEach, describe, expect, it, vi } from "vitest";

const KEY = "snipvault.snippets.v1";
const saved = { id: "existing-id", title: "Existing title", content: "first\nsecond", category: "Code", createdAt: 100, updatedAt: 200 };
beforeEach(() => { vi.resetModules(); vi.unstubAllGlobals(); localStorage.clear(); });
describe("SnipVault storage rules", () => {
  it("automatically loads existing Chrome snippets with all fields preserved and caches the read", async () => {
    const get = vi.fn().mockResolvedValue({ [KEY]: [saved] });
    vi.stubGlobal("chrome", { storage: { local: { get } } });
    const store = await import("../../extension/src/services/storage");
    expect(await store.loadSnippets()).toEqual([saved]);
    expect(await store.loadSnippets()).toEqual([saved]);
    expect(get).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(KEY);
  });
  it("does not overwrite snippets when the initial Chrome storage read fails", async () => {
    const set = vi.fn();
    vi.stubGlobal("chrome", { storage: { local: { get: vi.fn().mockRejectedValue(new Error("Unavailable")), set } } });
    const store = await import("../../extension/src/services/storage");
    await expect(store.loadSnippets()).rejects.toThrow("Unavailable");
    await expect(store.createSnippet({ title: "New", content: "value", category: "General" })).rejects.toThrow("Unavailable");
    expect(set).not.toHaveBeenCalled();
  });
  it("does not overwrite corrupt saved data", async () => {
    const raw = JSON.stringify([saved, { content: "invalid" }]); localStorage.setItem(KEY, raw);
    const store = await import("../../extension/src/services/storage");
    await expect(store.createSnippet({ title: "New", content: "value", category: "General" })).rejects.toThrow("invalid item");
    expect(localStorage.getItem(KEY)).toBe(raw);
  });
  it("serializes rapid mutations without losing existing data", async () => {
    localStorage.setItem(KEY, JSON.stringify([saved]));
    const store = await import("../../extension/src/services/storage");
    await Promise.all([store.createSnippet({ title: "One", content: "one", category: "Work" }), store.createSnippet({ title: "Two", content: "two", category: "Personal" })]);
    const list = await store.loadSnippets();
    expect(list).toHaveLength(3); expect(list.find((s) => s.id === saved.id)).toEqual(saved);
    await store.updateSnippet(saved.id, { title: "Edited", content: saved.content, category: "Code" });
    expect((await store.loadSnippets()).find((s) => s.id === saved.id)).toMatchObject({ id: saved.id, createdAt: 100, title: "Edited", content: "first\nsecond" });
  });
  it("keeps the cached collection after a failed write", async () => {
    vi.stubGlobal("chrome", { storage: { local: { get: vi.fn().mockResolvedValue({ [KEY]: [saved] }), set: vi.fn().mockRejectedValue(new Error("Quota exceeded")) } } });
    const store = await import("../../extension/src/services/storage");
    await store.loadSnippets();
    await expect(store.deleteSnippet(saved.id)).rejects.toThrow("Storage is full");
    expect(await store.loadSnippets()).toEqual([saved]);
  });
  it("merges imports without replacing duplicate IDs or mutating imported values", async () => {
    localStorage.setItem(KEY, JSON.stringify([saved]));
    const store = await import("../../extension/src/services/storage");
    const incoming = { ...saved, content: "Imported" };
    const result = await store.importSnippets([incoming]);
    expect(result.renamed).toBe(1); expect(result.list).toHaveLength(2); expect(incoming.id).toBe(saved.id);
    expect(result.list.find((s) => s.id === saved.id)).toEqual(saved);
  });
  it("uses the actual Chrome usage and quota without asking for unlimited storage", async () => {
    const getBytesInUse = vi.fn().mockResolvedValue(12 * 1024);
    vi.stubGlobal("chrome", { storage: { local: { getBytesInUse, QUOTA_BYTES: 10 * 1024 * 1024 } } });
    const store = await import("../../extension/src/services/storage");
    expect(await store.getUsage()).toEqual({ bytes: 12288, quota: 10485760, percent: 0.1171875 });
    expect(getBytesInUse).toHaveBeenCalledWith(null);
  });
});
