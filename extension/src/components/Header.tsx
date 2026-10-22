import { Plus, Vault } from "lucide-react";
import { Button } from "./Button";

export function Header({ count, onAdd, disabled }: { count: number; onAdd: () => void; disabled?: boolean }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-3">
      <div className="flex items-center justify-center rounded-lg bg-[var(--color-surface-2)] p-2">
        <Vault size={20} className="text-[var(--color-accent)]" />
      </div>
      <h1 className="flex min-w-0 flex-1 items-center gap-2.5 text-base font-semibold text-[var(--color-fg)] tracking-tight">
        SnipVault 
        <span className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted)]">
          {count} notes
        </span>
      </h1>
      <Button variant="primary" onClick={onAdd} disabled={disabled} title="Add snippet (Ctrl/Cmd+N)">
        <Plus size={16} /> New
      </Button>
    </header>
  );
}