import { Plus, Vault } from "lucide-react";
import { Button } from "./Button";

export function Header({ count, onAdd, disabled }: { count: number; onAdd: () => void; disabled?: boolean }) {
  return <header className="flex h-16 shrink-0 items-center gap-2.5 px-4">
    <Vault size={18} className="text-accent" />
    <h1 className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold">SnipVault <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted">{count}</span></h1>
    <Button variant="primary" onClick={onAdd} disabled={disabled} title="Add snippet (Ctrl/Cmd+N)"><Plus size={14} /> Add</Button>
  </header>;
}
