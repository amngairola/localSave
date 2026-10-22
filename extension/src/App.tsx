import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { 
  Download, Keyboard, MoreHorizontal, Trash, Upload, 
  Search, Terminal, CheckSquare, Image as ImageIcon, Wand2, X 
} from "lucide-react";
import { Header } from "./components/Header";
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

type ConfirmAction = 
  | { type: "delete"; snippet: Snippet } 
  | { type: "clear" } 
  | { type: "import"; items: Snippet[]; invalid: number } 
  | null;

const KEYBOARD_SHORTCUTS = [
  ["Ctrl / ⌘ K", "Focus filter search"], 
  ["Ctrl / ⌘ N", "Add new note"], 
  ["↑ / ↓", "Navigate notes"], 
  ["Enter", "Copy selected"], 
  ["Esc", "Cancel / close"]
];

export default function App() {
  const s = useSnippets();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<{ editing?: Snippet } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copySignal, setCopySignal] = useState<{ id: string; count: number } | null>(null);
  
  const fileRef = useRef<HTMLInputElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isReady = !s.loading && !s.loadError;

  // Memoized Handlers for Performance
  const handleAdd = useCallback(() => setForm({}), []);
  const handleEdit = useCallback((snippet: Snippet) => setForm({ editing: snippet }), []);
  const handleDeleteRequest = useCallback((snippet: Snippet) => setConfirm({ type: "delete", snippet }), []);
  const handleSelect = useCallback((id: string) => setSelectedId(id), []);
  const showError = useCallback((message: string) => setToast({ msg: message, kind: "err" }), []);
  const reportError = (e: unknown) => showError(e instanceof Error ? e.message : String(e));
  const showSuccess = (msg: string) => setToast({ msg, kind: "ok" });

  // Auto-dismiss Toasts
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Click-outside handler for dropdown menu
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (event: MouseEvent) => { 
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false); 
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Filtered Snippets Memoization
  const filteredSnippets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q 
      ? s.snippets.filter(
          (snippet) => snippet.title.toLowerCase().includes(q) || snippet.content.toLowerCase().includes(q)
        ) 
      : s.snippets;
  }, [s.snippets, query]);

  const selectedIndex = filteredSnippets.findIndex((snippet) => snippet.id === selectedId);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (form || confirm || helpOpen) return;
      if (target instanceof HTMLTextAreaElement || (target instanceof HTMLInputElement && target !== filterInputRef.current)) return;
      
      const modifier = event.ctrlKey || event.metaKey;
      
      if (modifier && event.key.toLowerCase() === "k") { 
        event.preventDefault(); 
        filterInputRef.current?.focus(); 
        return; 
      }
      if (modifier && event.key.toLowerCase() === "n" && isReady) { 
        event.preventDefault(); 
        setMenuOpen(false); 
        handleAdd(); 
        return; 
      }
      if (event.key === "Escape") { 
        if (menuOpen) { 
          event.preventDefault(); 
          setMenuOpen(false); 
        } else {
          setSelectedId(null);
          filterInputRef.current?.blur();
        }
        return; 
      }
      
      const isNavigating = target === filterInputRef.current || target === document.body || (target instanceof HTMLElement && target.tagName === "ARTICLE");
      if (!isNavigating || modifier || event.altKey) return;
      
      if ((event.key === "ArrowDown" || event.key === "ArrowUp") && filteredSnippets.length) {
        event.preventDefault();
        const nextIndex = selectedIndex < 0 
          ? (event.key === "ArrowDown" ? 0 : filteredSnippets.length - 1) 
          : Math.max(0, Math.min(filteredSnippets.length - 1, selectedIndex + (event.key === "ArrowDown" ? 1 : -1)));
        const item = filteredSnippets[nextIndex];
        if (item) setSelectedId(item.id);
      }
      
      if (event.key === "Enter" && selectedIndex >= 0) {
        const item = filteredSnippets[selectedIndex];
        if (!item) return;
        event.preventDefault();
        setCopySignal((prev) => ({ id: item.id, count: (prev?.count ?? 0) + 1 }));
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [form, confirm, helpOpen, menuOpen, filteredSnippets, selectedIndex, isReady, handleAdd]);

  const handleExport = () => {
    const backupData = { app: "SnipVault", version: 1, exportedAt: new Date().toISOString(), snippets: s.snippets };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); 
    anchor.href = url; 
    anchor.download = `snipvault-backup-${new Date().toISOString().slice(0, 10)}.json`; 
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000); 
    setMenuOpen(false);
  };

  const handleFileUpload = async (file?: File) => {
    if (fileRef.current) fileRef.current.value = "";
    setMenuOpen(false);
    if (!file) return;
    try { 
      const { valid, invalid } = validateImport(await file.text()); 
      if (!valid.length) throw new Error("No valid snippets found in this file."); 
      setConfirm({ type: "import", items: valid, invalid }); 
    } catch (e) { 
      reportError(e); 
    }
  };

  const executeConfirmAction = async () => {
    const action = confirm;
    if (!action) return;
    try {
      if (action.type === "delete") { 
        await s.remove(action.snippet.id); 
        showSuccess("Note deleted."); 
      }
      if (action.type === "clear") { 
        await s.clear(); 
        showSuccess("Vault cleared."); 
      }
      if (action.type === "import") { 
        const renamed = await s.importMany(action.items); 
        showSuccess(`Imported ${action.items.length} notes${renamed ? ` (${renamed} duplicates renamed)` : ""}.`); 
      }
      setConfirm(null);
    } catch (e) { 
      reportError(e); 
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[var(--color-bg)] text-[var(--color-fg)] font-sans antialiased overflow-hidden selection:bg-[var(--color-accent)] selection:text-[var(--color-accent-fg)]">
      
      {/* Top Header Navigation */}
      <header className="shrink-0 border-b border-[var(--color-line)] bg-[var(--color-surface)]/50 backdrop-blur-md px-6 lg:px-12">
        <Header count={s.snippets.length} onAdd={handleAdd} disabled={!isReady} />
      </header>

      {/* Main Dashboard Area */}
      <main 
        aria-label="Saved snippets" 
        aria-busy={s.loading} 
        className="min-h-0 flex-1 overflow-y-auto px-6 lg:px-12 py-8 focus:outline-none"
      >
        <div className="max-w-2xl mx-auto mb-10 space-y-4">
          {/* Quick Create Note Input (Google Keep Style) */}
          <div 
            onClick={handleAdd}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-3.5 shadow-md cursor-text hover:border-[var(--color-muted)] hover:shadow-lg transition-all duration-200"
          >
            <span className="text-[var(--color-muted)] text-sm font-medium">Take a note...</span>
            <div className="flex items-center gap-4 text-[var(--color-muted)]">
              <CheckSquare size={18} className="hover:text-[var(--color-fg)] transition-colors cursor-pointer" />
              <Wand2 size={18} title="Format text" className="hover:text-[var(--color-accent)] transition-colors cursor-pointer" />
              <ImageIcon size={18} className="hover:text-[var(--color-fg)] transition-colors cursor-pointer" />
            </div>
          </div>

          {/* Dedicated Filter Input */}
          <div className="relative flex items-center group">
            <Search size={16} className="absolute left-4 text-[var(--color-muted)] group-focus-within:text-[var(--color-accent)] transition-colors pointer-events-none" />
            <input 
              ref={filterInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter notes by title or content..."
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/40 py-3 pl-11 pr-10 text-sm text-[var(--color-fg)] placeholder-[var(--color-muted)] shadow-sm focus:bg-[var(--color-surface)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] focus:outline-none transition-all duration-200"
            />
            {query && (
              <button 
                onClick={() => setQuery("")}
                className="absolute right-3 p-1 rounded-md text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
                title="Clear filter"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {s.loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] animate-pulse">
              <Terminal className="w-5 h-5 animate-spin text-[var(--color-accent)]" />
              Loading your vault...
            </div>
          </div>
        ) : s.loadError ? (
          <div role="alert" className="max-w-xl mx-auto rounded-xl border border-red-900/50 bg-red-950/20 p-5 text-sm text-red-400 flex flex-col items-center text-center">
            <p className="font-medium">{s.loadError}</p>
            <Button onClick={() => void s.reload()} className="mt-4 bg-red-900/40 hover:bg-red-900/60 text-red-200 px-6">
              Retry Connection
            </Button>
          </div>
        ) : filteredSnippets.length ? (
          <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 gap-4 space-y-4 pb-12">
            {filteredSnippets.map((snippet) => (
              <div key={snippet.id} className="break-inside-avoid">
                <SnippetCard 
                  snippet={snippet} 
                  selected={snippet.id === selectedId} 
                  copyRequest={copySignal?.id === snippet.id ? copySignal.count : 0} 
                  onSelect={handleSelect} 
                  onEdit={handleEdit} 
                  onDelete={handleDeleteRequest} 
                  onError={showError} 
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState searching={!!query.trim()} />
        )}
      </main>

      {/* Footer System Status Bar */}
      <footer className="relative flex shrink-0 items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-surface)]/80 px-6 lg:px-12 py-3 backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <StorageUsage usage={s.usage} error={s.usageError} />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setHelpOpen(true)} 
            aria-label="Keyboard shortcuts" 
            title="Keyboard shortcuts" 
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] transition-colors"
          >
            <Keyboard size={16} />
          </Button>

          <div ref={menuRef} className="relative">
            <Button 
              onClick={() => setMenuOpen((v) => !v)} 
              aria-label="Settings" 
              title="Backup and settings" 
              aria-expanded={menuOpen} 
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)] transition-colors"
            >
              <MoreHorizontal size={16} />
            </Button>
            
            {menuOpen && (
              <div className="absolute right-0 bottom-12 z-40 w-52 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
                <button 
                  onClick={handleExport} 
                  disabled={!isReady || !s.snippets.length}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 transition-colors text-left"
                >
                  <Download size={14} className="text-[var(--color-accent)]" /> Export JSON
                </button>
                <button 
                  disabled={!isReady} 
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] disabled:opacity-50 transition-colors text-left"
                >
                  <Upload size={14} className="text-[var(--color-ok)]" /> Import JSON
                </button>
                <div className="my-1.5 h-px bg-[var(--color-line)]" />
                <button 
                  disabled={!isReady || !s.snippets.length} 
                  onClick={() => { setMenuOpen(false); setConfirm({ type: "clear" }); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-50 transition-colors text-left"
                >
                  <Trash size={14} /> Clear Vault
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>

      {/* Hidden File Input for Imports */}
      <input 
        ref={fileRef} 
        type="file" 
        accept="application/json,.json" 
        className="hidden" 
        onChange={(e) => void handleFileUpload(e.target.files?.[0])} 
      />

      {/* Dynamic Modals */}
      {form && (
        <SnippetForm 
          initial={form.editing} 
          onCancel={() => setForm(null)} 
          onSave={async (input) => { 
            if (form.editing) await s.update(form.editing.id, input); 
            else await s.create(input); 
            setForm(null); 
            showSuccess(form.editing ? "Note updated." : "Note created."); 
          }} 
        />
      )}
      
      {confirm?.type === "delete" && (
        <ConfirmDialog 
          danger 
          title="Delete Note?" 
          confirmLabel="Delete" 
          onCancel={() => setConfirm(null)} 
          onConfirm={executeConfirmAction} 
          message={<span className="text-[var(--color-muted)]">“<strong className="text-[var(--color-fg)]">{confirm.snippet.title}</strong>” will be permanently removed.</span>} 
        />
      )}
      
      {confirm?.type === "clear" && (
        <ConfirmDialog 
          danger 
          title="Clear Entire Vault?" 
          confirmLabel="Clear all" 
          onCancel={() => setConfirm(null)} 
          onConfirm={executeConfirmAction} 
          message={`This will permanently delete all ${s.snippets.length} notes from your vault. This action cannot be undone.`} 
        />
      )}
      
      {confirm?.type === "import" && (
        <ConfirmDialog 
          title="Merge Vault?" 
          confirmLabel="Import Data" 
          onCancel={() => setConfirm(null)} 
          onConfirm={executeConfirmAction} 
          message={`Merge ${confirm.items.length} new notes with your existing vault${confirm.invalid ? ` (${confirm.invalid} invalid entries skipped)` : ""}?`} 
        />
      )}
      
      {helpOpen && (
        <Modal onClose={() => setHelpOpen(false)} label="Keyboard shortcuts">
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-[var(--color-fg)] tracking-tight">Keyboard Shortcuts</h2>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.map(([keys, action]) => (
                <div key={keys} className="flex items-center justify-between text-sm py-2 border-b border-[var(--color-line)] last:border-0">
                  <span className="text-[var(--color-muted)] font-medium">{action}</span>
                  <kbd className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-2)] px-2.5 py-1 font-mono text-[var(--color-fg)] shadow-sm">{keys}</kbd>
                </div>
              ))}
            </div>
            <Button onClick={() => setHelpOpen(false)} className="w-full mt-2 bg-[var(--color-accent)] text-[var(--color-accent-fg)] font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              Done
            </Button>
          </div>
        </Modal>
      )}

      {/* Global Toast Notifications */}
      {toast && (
        <div 
          role={toast.kind === "err" ? "alert" : "status"} 
          className={`fixed top-6 left-1/2 z-[60] -translate-x-1/2 rounded-full border px-5 py-2.5 text-sm font-medium shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 ${
            toast.kind === "ok" 
              ? "border-[var(--color-ok)]/30 bg-emerald-950/80 text-[var(--color-ok)]" 
              : "border-[var(--color-danger)]/30 bg-red-950/80 text-[var(--color-danger)]"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}