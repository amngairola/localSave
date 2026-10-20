import type { Ref } from "react";
import { Search, X } from "lucide-react";
import { Button } from "./Button";

export function SearchBar({ value, onChange, inputRef }: { value: string; onChange: (value: string) => void; inputRef: Ref<HTMLInputElement> }) {
  return <div className="relative shrink-0 px-4 pb-3">
    <Search size={14} className="pointer-events-none absolute top-4 left-7 text-muted" />
    <input ref={inputRef} autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search snippets…" aria-label="Search snippets" className="h-10 w-full rounded-md border border-line bg-surface pr-10 pl-8 text-[13px] outline-none placeholder:text-muted focus:border-accent" />
    {value && <Button onClick={() => onChange("")} aria-label="Clear search" title="Clear search" className="absolute top-1.5 right-5 px-1.5"><X size={14} /></Button>}
  </div>;
}
