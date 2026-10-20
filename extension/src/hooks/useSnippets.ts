import { useCallback, useEffect, useState } from "react";
import * as store from "../services/storage";
import type { Snippet, SnippetInput, StorageUsage } from "../types/snippet";

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [usageError, setUsageError] = useState(false);
  const refreshUsage = useCallback(async () => {
    try { setUsage(await store.getUsage()); setUsageError(false); }
    catch { setUsageError(true); }
  }, []);
  const reload = useCallback(async () => {
    setLoading(true);
    try { setSnippets(await store.loadSnippets()); setLoadError(null); void refreshUsage(); }
    catch (error) { setLoadError(error instanceof Error ? error.message : "Could not load snippets."); }
    finally { setLoading(false); }
  }, [refreshUsage]);
  useEffect(() => {
    void reload();
    return store.subscribeSnippets((list) => { setSnippets(list); setLoadError(null); void refreshUsage(); });
  }, [reload, refreshUsage]);
  const apply = useCallback(async (operation: Promise<Snippet[]>) => {
    setSnippets(await operation);
    void refreshUsage();
  }, [refreshUsage]);
  const create = useCallback((input: SnippetInput) => apply(store.createSnippet(input)), [apply]);
  const update = useCallback((id: string, input: SnippetInput) => apply(store.updateSnippet(id, input)), [apply]);
  const remove = useCallback((id: string) => apply(store.deleteSnippet(id)), [apply]);
  const clear = useCallback(() => apply(store.clearSnippets()), [apply]);
  const importMany = useCallback(async (items: Snippet[]) => {
    const result = await store.importSnippets(items);
    setSnippets(result.list); void refreshUsage(); return result.renamed;
  }, [refreshUsage]);
  return { snippets, loading, loadError, usage, usageError, reload, create, update, remove, clear, importMany };
}
