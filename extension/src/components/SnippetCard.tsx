import { memo, useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, Trash2, Wand2, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const card = useRef<HTMLElement>(null);
  
  // Heuristic to determine if the snippet is long enough to need a collapse toggle
  const isLongContent = snippet.content.length > 250 || snippet.content.split('\n').length > 6;
  
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

  const handleFormat = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  
    const text = snippet.content ?? "";
  
    const formattedText = text
      // Normalize line endings
      .replace(/\r\n?/g, "\n")
      // Remove trailing whitespace from each line
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      // Limit excessive blank lines to two
      .replace(/\n{3,}/g, "\n\n")
      // Remove unnecessary spaces at the beginning and end
      .trim();
  
    onEdit({
      ...snippet,
      content: formattedText,
    });
  };

  return (
    <article 
      ref={card} 
      tabIndex={0} 
      aria-label={snippet.title} 
      aria-current={selected ? "true" : undefined} 
      onFocus={() => onSelect(snippet.id)} 
      onClick={() => onSelect(snippet.id)} 
      className={`group relative flex flex-col rounded-2xl border bg-[var(--color-surface)] p-4 shadow-sm outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${selected ? "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)] shadow-md" : "border-[var(--color-line)] hover:border-[var(--color-muted)] hover:shadow-md"}`}
    >
      {/* Header and Actions */}
      <div className="mb-3 flex items-start justify-between gap-4">
        <h2 className="min-w-0 flex-1 break-words text-sm font-semibold text-[var(--color-fg)] leading-snug pt-1" title={snippet.title}>
          {snippet.title}
        </h2>
        
        {/* Top-Right Action Buttons (Visible on hover) */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 -mt-1 -mr-1">
          <Button 
            onClick={(e) => { e.stopPropagation(); void copy(); }} 
            title="Copy snippet" 
            aria-label={`Copy ${snippet.title}`} 
            className={`px-2 ${copied ? "text-[var(--color-ok)]" : "text-[var(--color-accent)]"}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
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
      </div>
      
      {/* Content Area with Smooth Collapse/Expand */}
      <div className="relative">
        <div 
          className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${!isLongContent || isExpanded ? "max-h-[2000px]" : "max-h-[140px]"}`}
        >
          <pre className="font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-[var(--color-fg)]/80 pb-2">
            {snippet.content}
          </pre>
        </div>
        
        {/* Shadcn-style Gradient Fade Overlay (Only visible when collapsed) */}
        {isLongContent && !isExpanded && (
          <div className="absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-[var(--color-surface)] to-transparent pointer-events-none" />
        )}
      </div>
      
      {/* Footer Area: Toggle Button & Category */}
      <div className="mt-2 pt-2 flex items-center justify-between border-t border-[var(--color-line)]/50">
        <span className="shrink-0 rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted)]">
          {snippet.category}
        </span>
        
        {isLongContent && (
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsExpanded(!isExpanded); 
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--color-surface-2)]"
          >
            {isExpanded ? (
              <>Show less <ChevronUp size={14} /></>
            ) : (
              <>Show more <ChevronDown size={14} /></>
            )}
          </button>
        )}
      </div>
    </article>
  );
});