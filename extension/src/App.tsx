import { useEffect, useMemo, useRef, useState } from "react";
import { Download, MoreHorizontal, ShieldAlert, Trash, Upload } from "lucide-react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { SnippetCard } from "./components/SnippetCard";
import { SnippetForm } from "./components/SnippetForm";
import { StorageUsage } from "./components/StorageUsage";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { EmptyState } from "./components/EmptyState";
import { useSnippets } from "./hooks/useSnippets";
import { validateImport } from "./utils/validateImport";
import type { Snippet } from "./types/snippet";

type Toast = { msg: string; kind: "ok" | "err" } | null;
type Confirm =
  | { type: "delete"; snippet: Snippet }
  | { type: "clear" }
  | { type: "import"; items: Snippet[]; invalid: number }
  | null;

export default function App() {
  const s = useSnippets();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ editing?: Snippet } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [menu, setMenu] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const ok = (msg: string) => setToast({ msg, kind: "ok" });
  const err = (e: unknown) => setToast({ msg: e instanceof Error ? e.message : String(e), kind: "err" });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return s.snippets;
    return s.snippets.filter((x) => x.title.toLowerCase().includes(q) || x.content.toLowerCase().includes(q));
  }, [s.snippets, query]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: "SnipVault", version: 1, exportedAt: new Date().toISOString(), snippets: s.snippets }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `snipvault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMenu(false);
  };

  const onFile = async (f: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    setMenu(false);
    if (!f) return;
    try {
      const { valid, invalid } = validateImport(await f.text());
      if (!valid.length) throw new Error("No valid snippets found in this file.");
      setConfirm({ type: "import", items: valid, invalid });
    } catch (e) {
      err(e);
    }
  };

  const runConfirm = async () => {
    const c = confirm;
    setConfirm(null);
    if (!c) return;
    try {
      if (c.type === "delete") { await s.remove(c.snippet.id); ok("Snippet deleted."); }
      if (c.type === "clear") { await s.clear(); ok("All snippets cleared."); }
      if (c.type === "import") {
        const renamed = await s.importMany(c.items);
        ok(`Imported ${c.items.length} snippet${c.items.length === 1 ? "" : "s"}${renamed ? ` (${renamed} duplicate IDs renamed)` : ""}.`);
      }
    } catch (e) { err(e); }
  };

  const menuItem = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-surface-2";

  return (
    <div className="flex h-full flex-col">
      <Header count={s.snippets.length} onAdd={() => setForm({})} />
      <SearchBar value={query} onChange={setQuery} />

      <main className="flex-1 space-y-2 overflow-y-auto px-4 pb-3">
        {s.loading ? (
          <p className="py-10 text-center text-xs text-muted">Loading…</p>
        ) : filtered.length === 0 ? (
          <EmptyState searching={!!query.trim()} onAdd={() => setForm({})} />
        ) : (
          filtered.map((x) => (
            <SnippetCard key={x.id} snippet={x} onEdit={() => setForm({ editing: x })}
              onDelete={() => setConfirm({ type: "delete", snippet: x })} onError={(m) => err(new Error(m))} />
          ))
        )}
      </main>

      <footer className="relative space-y-2 border-t border-line bg-bg px-4 py-2.5">
        <div className="flex items-end gap-3">
          <div className="flex-1"><StorageUsage usage={s.usage} error={s.usageError} /></div>
          <button onClick={() => setMenu((m) => !m)} aria-label="Settings" className="rounded-md p-1 text-muted hover:bg-surface-2 hover:text-fg">
            <MoreHorizontal size={16} />
          </button>
        </div>
        <p className="flex items-center gap-1 text-[10.5px] text-muted">
          <ShieldAlert size={11} className="shrink-0" />
          Stored on this device only, not encrypted. Don't save passwords or keys.
        </p>
        {menu && (
          <div className="absolute right-3 bottom-12 z-40 w-48 rounded-lg border border-line bg-surface p-1 shadow-xl">
            <button className={menuItem} onClick={exportJson} disabled={!s.snippets.length}><Download size={13} /> Export JSON</button>
            <button className={menuItem} onClick={() => fileRef.current?.click()}><Upload size={13} /> Import JSON</button>
            <button className={`${menuItem} text-danger`} disabled={!s.snippets.length} onClick={() => { setMenu(false); setConfirm({ type: "clear" }); }}>
              <Trash size={13} /> Clear All Snippets
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </footer>

      {form && (
        <SnippetForm
          initial={form.editing}
          onCancel={() => setForm(null)}
          onSave={async (input) => {
            if (form.editing) await s.update(form.editing.id, input);
            else await s.create(input);
            setForm(null);
            ok(form.editing ? "Snippet updated." : "Snippet saved.");
          }}
        />
      )}

      {confirm?.type === "delete" && (
        <ConfirmDialog danger title="Delete snippet?" confirmLabel="Delete" onCancel={() => setConfirm(null)} onConfirm={runConfirm}
          message={<>“{confirm.snippet.title}” will be permanently removed.</>} />
      )}
      {confirm?.type === "clear" && (
        <ConfirmDialog danger title="Clear all snippets?" confirmLabel="Clear all" onCancel={() => setConfirm(null)} onConfirm={runConfirm}
          message={`This permanently deletes all ${s.snippets.length} snippets. Consider exporting a backup first.`} />
      )}
      {confirm?.type === "import" && (
        <ConfirmDialog title="Import snippets?" confirmLabel="Merge" onCancel={() => setConfirm(null)} onConfirm={runConfirm}
          message={<>Found {confirm.items.length} valid snippet{confirm.items.length === 1 ? "" : "s"}{confirm.invalid ? `, ${confirm.invalid} invalid skipped` : ""}. They'll be merged with your existing {s.snippets.length}.</>} />
      )}

      {toast && (
        <div role="status" className={`fixed top-3 left-1/2 z-[60] -translate-x-1/2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg ${toast.kind === "ok" ? "bg-ok text-accent-fg" : "bg-danger text-accent-fg"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
