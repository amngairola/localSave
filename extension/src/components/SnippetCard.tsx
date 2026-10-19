import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, Pencil, Trash2 } from "lucide-react";
import type { Snippet } from "../types/snippet";
import { copyText } from "../services/clipboard";

const PREVIEW_CHARS = 220;
const PREVIEW_LINES = 4;

interface Props {
  snippet: Snippet;
  onEdit: () => void;
  onDelete: () => void;
  onError: (msg: string) => void;
}

export function SnippetCard({ snippet, onEdit, onDelete, onError }: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const lines = snippet.content.split("\n");
  const isLong = snippet.content.length > PREVIEW_CHARS || lines.length > PREVIEW_LINES;
  const preview = isLong && !expanded
    ? lines.slice(0, PREVIEW_LINES).join("\n").slice(0, PREVIEW_CHARS) + "…"
    : snippet.content;

  const copy = async () => {
    try {
      await copyText(snippet.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onError("Couldn't access the clipboard.");
    }
  };

  const btn = "rounded-md p-1.5 text-muted hover:bg-surface-2 hover:text-fg";
  return (
    <article className="rounded-xl border border-line bg-surface p-3">
      <div className="mb-1.5 flex items-start gap-2">
        <h3 className="min-w-0 flex-1 truncate font-semibold" title={snippet.title}>{snippet.title}</h3>
        <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[10px] text-muted">{snippet.category}</span>
      </div>
      <pre className={`max-h-60 overflow-auto font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-fg/80`}>{preview}</pre>
      <div className="mt-2 flex items-center gap-1">
        <button onClick={copy} className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${copied ? "bg-ok/15 text-ok" : "bg-accent/15 text-accent hover:bg-accent/25"}`}>
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied!" : "Copy"}
        </button>
        {isLong && (
          <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-0.5 px-1.5 text-xs text-muted hover:text-fg">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {expanded ? "Less" : "More"}
          </button>
        )}
        <div className="flex-1" />
        <button onClick={onEdit} aria-label="Edit snippet" className={btn}><Pencil size={14} /></button>
        <button onClick={onDelete} aria-label="Delete snippet" className={`${btn} hover:text-danger`}><Trash2 size={14} /></button>
      </div>
    </article>
  );
}
