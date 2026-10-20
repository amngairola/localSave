import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { CATEGORIES, TITLE_MAX, type Category, type Snippet, type SnippetInput } from "../types/snippet";

interface Props {
  initial?: Snippet | undefined;
  onSave: (input: SnippetInput) => Promise<void>;
  onCancel: () => void;
}

export function SnippetForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [category, setCategory] = useState<Category>(initial?.category ?? "General");
  const [errors, setErrors] = useState<{ title?: string; content?: string; save?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!title.trim()) next.title = "Title is required.";
    else if (title.trim().length > TITLE_MAX) next.title = `Max ${TITLE_MAX} characters.`;
    if (!content.trim()) next.content = "Content is required.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      await onSave({ title: title.trim(), content, category });
    } catch (err) {
      setErrors({ save: err instanceof Error ? err.message : "Could not save." });
      setSaving(false);
    }
  };

  const field = "w-full rounded-lg border bg-bg px-3 py-2 text-[13px] outline-none focus:border-accent";
  return (
    <Modal onClose={onCancel} label={initial ? "Edit snippet" : "New snippet"}>
      <form onSubmit={submit} noValidate className="space-y-3" onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          if (!saving) event.currentTarget.requestSubmit();
        }
      }}>
        <h2 className="text-sm font-semibold">{initial ? "Edit snippet" : "New snippet"}</h2>
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted">
            <label htmlFor="sv-title">Title</label>
            <span>{title.trim().length}/{TITLE_MAX}</span>
          </div>
          <input id="sv-title" autoFocus maxLength={TITLE_MAX + 20} value={title} onChange={(e) => setTitle(e.target.value)}
            className={`${field} ${errors.title ? "border-danger" : "border-line"}`} />
          {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
        </div>
        <div>
          <label htmlFor="sv-content" className="mb-1 block text-xs text-muted">Content</label>
          <textarea id="sv-content" rows={6} value={content} onChange={(e) => setContent(e.target.value)} spellCheck={false}
            className={`${field} resize-none font-mono text-xs ${errors.content ? "border-danger" : "border-line"}`} />
          {errors.content && <p className="mt-1 text-xs text-danger">{errors.content}</p>}
        </div>
        <div>
          <label htmlFor="sv-cat" className="mb-1 block text-xs text-muted">Category</label>
          <select id="sv-cat" value={category} onChange={(e) => setCategory(e.target.value as Category)} className={`${field} border-line`}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {errors.save && <p className="rounded-lg bg-danger/10 p-2 text-xs text-danger">{errors.save}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
