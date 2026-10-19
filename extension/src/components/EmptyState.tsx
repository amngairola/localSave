import { FileText, SearchX } from "lucide-react";

export function EmptyState({ searching, onAdd }: { searching: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 grid size-10 place-items-center rounded-full bg-surface-2 text-muted">
        {searching ? <SearchX size={18} /> : <FileText size={18} />}
      </div>
      <p className="font-medium">{searching ? "No matching snippets" : "No snippets yet"}</p>
      <p className="mt-1 mb-4 text-xs text-muted">
        {searching ? "Try a different word, or clear the search." : "Save text you reuse often and copy it with one click."}
      </p>
      {!searching && (
        <button onClick={onAdd} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg">Add Snippet</button>
      )}
    </div>
  );
}
