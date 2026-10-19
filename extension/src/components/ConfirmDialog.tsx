import type { ReactNode } from "react";
import { Modal } from "./Modal";

interface Props {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: Props) {
  return (
    <Modal onClose={onCancel}>
      <h2 className="mb-1 text-sm font-semibold">{title}</h2>
      <div className="mb-4 text-xs text-muted">{message}</div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-line px-3 py-1.5 text-xs hover:bg-surface-2">Cancel</button>
        <button
          autoFocus
          onClick={onConfirm}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${danger ? "bg-danger text-accent-fg" : "bg-accent text-accent-fg"}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
