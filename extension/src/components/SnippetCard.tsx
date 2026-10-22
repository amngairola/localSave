import { memo, useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, Trash2, Wand2 } from "lucide-react";
import type { Snippet } from "../types/snippet";
import { copyText } from "../services/clipboard";
import { Button } from "./Button";

interface Props {
  snippet: Snippet;
  selected: boolean;
  copyRequest: number;
  onSelect: (id: string) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (snippet: Snippet) => void;
  onError: (message: string) => void;
}

export const SnippetCard = memo(function SnippetCard({ snippet, selected, copyRequest, onSelect, onEdit, onDelete, onError }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const card = useRef<HTMLElement>(null);
  
  const copy = async () => {
    try {
      await copyText(snippet.content);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch { 
      onError("Couldn't access the clipboard."); 
    }
  };
  
  const copyRef = useRef(copy);
  copyRef.current = copy;
  
  useEffect(() => { if (copyRequest) void copyRef.current(); }, [copyRequest]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (selected) card.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [selected]);

  // Placeholder for formatting logic - can be expanded to auto-indent or prettier formatting
  const handleFormat = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Execute formatting logic here, then trigger update
    onEdit({ ...snippet }); 
  };

  return (
    <article 
      ref={card} 
      tabIndex={0} 
      aria-label={snippet.title} 
      aria-current={selected ? "true" : undefined} 
      onFocus={() => onSelect(snippet.id)} 
      onClick={() => onSelect(snippet.id)} 
      className={`group relative flex flex-col rounded-2xl border bg-[var(--color-surface)] p-4 shadow-sm outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${selected ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]" : "border-[var(--color-line)] hover:border-[var(--color-muted)] hover:shadow-md"}`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h2 className="min-w-0 flex-1 break-words text-sm font-semibold text-[var(--color-fg)] leading-snug" title={snippet.title}>
          {snippet.title}
        </h2>
        <span className="shrink-0 rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
          {snippet.category}
        </span>
      </div>
      
      {/* Removed line-clamp to allow dynamic masonry height */}
      <pre className="font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-[var(--color-fg)]/80">
        {snippet.content}
      </pre>
      
      <div className="mt-4 flex items-center gap-1 opacity-100 sm:opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 border-t border-[var(--color-line)] pt-3 -mb-1">
        <Button 
          onClick={(e) => { e.stopPropagation(); void copy(); }} 
          title="Copy full snippet" 
          aria-label={`Copy ${snippet.title}`} 
          className={copied ? "text-[var(--color-ok)]" : "text-[var(--color-accent)]"}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span role="status" className="font-medium">{copied ? "Copied" : "Copy"}</span>
        </Button>
        <div className="flex-1" />
        <Button 
          onClick={handleFormat} 
          aria-label={`Format ${snippet.title}`} 
          title="Format text" 
          className="px-2 hover:text-[var(--color-accent)]"
        >
          <Wand2 size={14} />
        </Button>
        <Button 
          onClick={(e) => { e.stopPropagation(); onEdit(snippet); }} 
          aria-label={`Edit ${snippet.title}`} 
          title="Edit snippet" 
          className="px-2"
        >
          <Pencil size={14} />
        </Button>
        <Button 
          onClick={(e) => { e.stopPropagation(); onDelete(snippet); }} 
          aria-label={`Delete ${snippet.title}`} 
          title="Delete snippet" 
          className="px-2 hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </article>
  );
});