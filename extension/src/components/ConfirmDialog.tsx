import { useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onCancel }: Props) {
  const [pending, setPending] = useState(false);
  return (
    <Modal onClose={() => { if (!pending) onCancel(); }} label={title}>
      <h2 className="mb-1 text-sm font-semibold">{title}</h2>
      <div className="mb-4 text-xs text-muted">{message}</div>
      <div className="flex justify-end gap-2">
        <Button autoFocus onClick={onCancel} disabled={pending}>Cancel</Button>
        <Button
          disabled={pending}
          onClick={async () => { setPending(true); try { await onConfirm(); } finally { setPending(false); } }}
          variant={danger ? "danger" : "primary"}
        >
          {pending ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
