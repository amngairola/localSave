import { Search, X } from "lucide-react";

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative px-4 pb-3">
      <Search size={14} className="pointer-events-none absolute top-1/2 left-7 -translate-y-1/2 -mt-1.5 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search titles and content…"
        aria-label="Search snippets"
        className="w-full rounded-lg border border-line bg-surface py-2 pr-8 pl-8 text-[13px] outline-none placeholder:text-muted focus:border-accent"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute top-1/2 right-6 -translate-y-1/2 -mt-1.5 rounded p-0.5 text-muted hover:text-fg"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
