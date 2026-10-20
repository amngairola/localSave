export function EmptyState({ searching }: { searching: boolean }) {
  return <p className="py-8 text-center text-xs text-muted">{searching ? "No matching snippets" : "No snippets yet"}</p>;
}
