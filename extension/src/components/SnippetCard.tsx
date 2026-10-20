import { memo, useEffect, useRef, useState } from "react";
import { Check, Copy, Pencil, Trash2 } from "lucide-react";
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
    } catch { onError("Couldn't access the clipboard."); }
  };
  const copyRef = useRef(copy);
  copyRef.current = copy;
  useEffect(() => { if (copyRequest) void copyRef.current(); }, [copyRequest]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (selected) card.current?.scrollIntoView({ block: "nearest" }); }, [selected]);
  return <article ref={card} tabIndex={0} aria-label={snippet.title} aria-current={selected ? "true" : undefined} onFocus={() => onSelect(snippet.id)} onClick={() => onSelect(snippet.id)} className={`rounded-md border bg-surface p-3 outline-none focus-visible:ring-1 focus-visible:ring-accent ${selected ? "border-accent" : "border-line hover:border-muted"}`}>
    <div className="mb-2 flex items-start gap-2"><h2 className="min-w-0 flex-1 truncate text-[13px] font-semibold" title={snippet.title}>{snippet.title}</h2><span className="shrink-0 text-[10px] text-muted">{snippet.category}</span></div>
    <pre className="line-clamp-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-fg/80">{snippet.content.slice(0, 220)}{snippet.content.length > 220 ? "…" : ""}</pre>
    <div className="mt-2 flex h-7 items-center gap-1">
      <Button onClick={() => void copy()} title="Copy full snippet (Enter when selected)" aria-label={`Copy ${snippet.title}`} className={copied ? "text-ok" : "text-accent"}>{copied ? <Check size={13} /> : <Copy size={13} />}<span role="status">{copied ? "Copied" : "Copy"}</span></Button>
      <div className="flex-1" /><Button onClick={() => onEdit(snippet)} aria-label={`Edit ${snippet.title}`} title="Edit snippet" className="px-1.5"><Pencil size={13} /></Button><Button onClick={() => onDelete(snippet)} aria-label={`Delete ${snippet.title}`} title="Delete snippet" className="px-1.5 hover:text-danger"><Trash2 size={13} /></Button>
    </div>
  </article>;
});
