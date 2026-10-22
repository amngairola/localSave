import { Inbox } from "lucide-react";

export function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-muted)]">
        <Inbox size={28} />
      </div>
      <p className="text-sm font-medium text-[var(--color-fg)]">
        {searching ? "No notes found" : "Your vault is empty"}
      </p>
      <p className="mt-1 text-xs text-[var(--color-muted)] max-w-xs">
        {searching ? "Try a different search term or clear the filter." : "Notes you add will appear here."}
      </p>
    </div>
  );
}