import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Keyboard, MoreHorizontal, Trash, Upload } from "lucide-react";
import { Header } from "./components/Header";
import { SearchBar } from "./components/SearchBar";
import { SnippetCard } from "./components/SnippetCard";
import { SnippetForm } from "./components/SnippetForm";
import { StorageUsage } from "./components/StorageUsage";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { EmptyState } from "./components/EmptyState";
import { Button } from "./components/Button";
import { Modal } from "./components/Modal";
import { useSnippets } from "./hooks/useSnippets";
import { validateImport } from "./utils/validateImport";
import type { Snippet } from "./types/snippet";

type Confirm = { type: "delete"; snippet: Snippet } | { type: "clear" } | { type: "import"; items: Snippet[]; invalid: number } | null;
const shortcuts = [["Ctrl / ⌘ K", "Search"], ["Ctrl / ⌘ N", "Add snippet"], ["↑ / ↓", "Select snippet"], ["Enter", "Copy selected snippet"], ["Ctrl / ⌘ Enter", "Save snippet"], ["Esc", "Cancel / close"]];

export default function App() {
  const s = useSnippets();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ editing?: Snippet } | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [menu, setMenu] = useState(false);
  const [help, setHelp] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copySignal, setCopySignal] = useState<{ id: string; count: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const ready = !s.loading && !s.loadError;
  const add = useCallback(() => setForm({}), []);
  const edit = useCallback((snippet: Snippet) => setForm({ editing: snippet }), []);
  const remove = useCallback((snippet: Snippet) => setConfirm({ type: "delete", snippet }), []);
  const select = useCallback((id: string) => setSelectedId(id), []);
  const error = useCallback((message: string) => setToast({ msg: message, kind: "err" }), []);
  const report = (e: unknown) => error(e instanceof Error ? e.message : String(e));
  const ok = (msg: string) => setToast({ msg, kind: "ok" });
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (!menu) return;
    const close = (event: MouseEvent) => { if (event.target instanceof Node && !menuRef.current?.contains(event.target)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? s.snippets.filter((snippet) => snippet.title.toLowerCase().includes(q) || snippet.content.toLowerCase().includes(q)) : s.snippets;
  }, [s.snippets, query]);
  const selected = filtered.findIndex((snippet) => snippet.id === selectedId);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      const target = event.target;
      if (form || confirm || help) return;
      if (target instanceof HTMLTextAreaElement) return;
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); return; }
      if (modifier && event.key.toLowerCase() === "n" && ready) { event.preventDefault(); setMenu(false); add(); return; }
      if (event.key === "Escape") { if (menu) { event.preventDefault(); setMenu(false); } else setSelectedId(null); return; }
      const navigating = target === searchRef.current || target === document.body || (target instanceof HTMLElement && target.tagName === "ARTICLE");
      if (!navigating || modifier || event.altKey) return;
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && filtered.length) {
        event.preventDefault();
        const index = selected < 0 ? (event.key === "ArrowDown" ? 0 : filtered.length - 1) : Math.max(0, Math.min(filtered.length - 1, selected + (event.key === "ArrowDown" ? 1 : -1)));
        const item = filtered[index];
        if (item) setSelectedId(item.id);
      }
      if (event.key === "Enter" && selected >= 0) {
        const item = filtered[selected];
        if (!item) return;
        event.preventDefault();
        setCopySignal((previous) => ({ id: item.id, count: (previous?.count ?? 0) + 1 }));
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [form, confirm, help, menu, filtered, selected, ready, add]);
  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ app: "SnipVault", version: 1, exportedAt: new Date().toISOString(), snippets: s.snippets }, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `snipvault-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); setMenu(false);
  };
  const onFile = async (file?: File) => {
    if (fileRef.current) fileRef.current.value = "";
    setMenu(false);
    if (!file) return;
    try { const { valid, invalid } = validateImport(await file.text()); if (!valid.length) throw new Error("No valid snippets found in this file."); setConfirm({ type: "import", items: valid, invalid }); }
    catch (e) { report(e); }
  };
  const runConfirm = async () => {
    const action = confirm;
    if (!action) return;
    try {
      if (action.type === "delete") { await s.remove(action.snippet.id); ok("Snippet deleted."); }
      if (action.type === "clear") { await s.clear(); ok("All snippets cleared."); }
      if (action.type === "import") { const renamed = await s.importMany(action.items); ok(`Imported ${action.items.length} snippets${renamed ? ` (${renamed} duplicate IDs renamed)` : ""}.`); }
      setConfirm(null);
    } catch (e) { report(e); }
  };
  return <div className="flex h-full flex-col">
    <Header count={s.snippets.length} onAdd={add} disabled={!ready} />
    <SearchBar value={query} onChange={setQuery} inputRef={searchRef} />
    <main aria-label="Saved snippets" aria-busy={s.loading} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-3">
      {s.loading ? <p className="py-8 text-center text-xs text-muted" role="status">Loading…</p> : s.loadError ? <div role="alert" className="py-4 text-xs text-danger"><p>{s.loadError}</p><Button onClick={() => void s.reload()} className="mt-2">Retry</Button></div> : filtered.length ? filtered.map((snippet) => <SnippetCard key={snippet.id} snippet={snippet} selected={snippet.id === selectedId} copyRequest={copySignal?.id === snippet.id ? copySignal.count : 0} onSelect={select} onEdit={edit} onDelete={remove} onError={error} />) : <EmptyState searching={!!query.trim()} />}
    </main>
    <footer className="relative flex shrink-0 items-center gap-2 border-t border-line px-4 py-2.5">
      <div className="min-w-0 flex-1"><StorageUsage usage={s.usage} error={s.usageError} /></div>
      <Button onClick={() => setHelp(true)} aria-label="Keyboard shortcuts" title="Keyboard shortcuts" className="px-1.5"><Keyboard size={15} /></Button>
      <div ref={menuRef}><Button onClick={() => setMenu((value) => !value)} aria-label="Settings" title="Backup and settings" aria-expanded={menu} className="px-1.5"><MoreHorizontal size={15} /></Button>
        {menu && <div className="absolute right-3 bottom-12 z-40 w-48 rounded-md border border-line bg-surface p-1">
          <Button className="w-full justify-start" onClick={exportJson} disabled={!ready || !s.snippets.length}><Download size={13} /> Export JSON</Button>
          <Button className="w-full justify-start" disabled={!ready} onClick={() => fileRef.current?.click()}><Upload size={13} /> Import JSON</Button>
          <Button className="w-full justify-start hover:text-danger" disabled={!ready || !s.snippets.length} onClick={() => { setMenu(false); setConfirm({ type: "clear" }); }}><Trash size={13} /> Clear all snippets</Button>
        </div>}
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(event) => void onFile(event.target.files?.[0])} />
    </footer>
    {form && <SnippetForm initial={form.editing} onCancel={() => setForm(null)} onSave={async (input) => { if (form.editing) await s.update(form.editing.id, input); else await s.create(input); setForm(null); ok(form.editing ? "Snippet updated." : "Snippet saved."); }} />}
    {confirm?.type === "delete" && <ConfirmDialog danger title="Delete snippet?" confirmLabel="Delete" onCancel={() => setConfirm(null)} onConfirm={runConfirm} message={<>“{confirm.snippet.title}” will be permanently removed.</>} />}
    {confirm?.type === "clear" && <ConfirmDialog danger title="Clear all snippets?" confirmLabel="Clear all" onCancel={() => setConfirm(null)} onConfirm={runConfirm} message={`This permanently deletes all ${s.snippets.length} snippets.`} />}
    {confirm?.type === "import" && <ConfirmDialog title="Import snippets?" confirmLabel="Merge" onCancel={() => setConfirm(null)} onConfirm={runConfirm} message={`Merge ${confirm.items.length} snippets with your existing ${s.snippets.length}${confirm.invalid ? ` (${confirm.invalid} invalid skipped)` : ""}?`} />}
    {help && <Modal onClose={() => setHelp(false)} label="Keyboard shortcuts"><h2 className="mb-4 text-sm font-semibold">Keyboard shortcuts</h2><dl className="space-y-3">{shortcuts.map(([keys, action]) => <div key={keys} className="flex items-center justify-between gap-2 text-xs"><dt className="text-muted">{action}</dt><dd className="rounded border border-line bg-bg px-2 py-1 font-mono">{keys}</dd></div>)}</dl><Button onClick={() => setHelp(false)} className="mt-4 w-full">Close</Button></Modal>}
    {toast && <div role={toast.kind === "err" ? "alert" : "status"} className={`fixed top-2 left-1/2 z-[60] max-w-[90%] -translate-x-1/2 rounded-md border border-line bg-surface px-3 py-2 text-xs ${toast.kind === "ok" ? "text-ok" : "text-danger"}`}>{toast.msg}</div>}
  </div>;
}
