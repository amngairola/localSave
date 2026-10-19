import { Plus, Vault } from "lucide-react";

export function Header({ count, onAdd }: { count: number; onAdd: () => void }) {
  return (
    <header className="flex items-center gap-3 px-4 pt-4 pb-3">
      <div className="grid size-9 place-items-center rounded-lg bg-accent/15 text-accent">
        <Vault size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="text-[15px] font-semibold leading-tight">
          SnipVault <span className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">{count}</span>
        </h1>
        <p className="text-xs text-muted">Your snippets, stored locally.</p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-1 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-fg hover:brightness-110"
      >
        <Plus size={14} /> Add Snippet
      </button>
    </header>
  );
}
