import { useCallback, useEffect, useState } from "react";
import * as store from "../services/storage";
import type { Snippet, SnippetInput, StorageUsage } from "../types/snippet";

export function useSnippets() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [usageError, setUsageError] = useState(false);

  const refreshUsage = useCallback(async () => {
    try {
      setUsage(await store.getUsage());
      setUsageError(false);
    } catch {
      setUsageError(true);
    }
  }, []);

  useEffect(() => {
    store.loadSnippets().then((l) => {
      setSnippets(l);
      setLoading(false);
      void refreshUsage();
    });
  }, [refreshUsage]);

  const apply = useCallback(
    async (p: Promise<Snippet[]>) => {
      const l = await p;
      setSnippets(l);
      void refreshUsage();
    },
    [refreshUsage],
  );

  return {
    snippets,
    loading,
    usage,
    usageError,
    create: (i: SnippetInput) => apply(store.createSnippet(i)),
    update: (id: string, i: SnippetInput) => apply(store.updateSnippet(id, i)),
    remove: (id: string) => apply(store.deleteSnippet(id)),
    clear: () => apply(store.clearSnippets()),
    importMany: async (l: Snippet[]) => {
      const r = await store.importSnippets(l);
      setSnippets(r.list);
      void refreshUsage();
      return r.renamed;
    },
  };
}
