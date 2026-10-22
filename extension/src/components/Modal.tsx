import { useEffect, useRef, type ReactNode } from "react";

export function Modal({ children, onClose, label }: { children: ReactNode; onClose: () => void; label: string }) {
  const dialog = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    if (!element) return;
    
    if (!element.contains(document.activeElement)) {
      (element.querySelector<HTMLElement>("input, button, textarea, select") ?? element).focus();
    }
    
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key === "Tab") {
        const controls = [...element.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')];
        const first = controls[0]; const last = controls.at(-1);
        if (!first || !last) { event.preventDefault(); element.focus(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === element)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    
    element.addEventListener("keydown", handle);
    return () => { element.removeEventListener("keydown", handle); previous?.focus(); };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay)] p-4 backdrop-blur-sm animate-in fade-in duration-200" 
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div 
        ref={dialog} 
        role="dialog" 
        aria-modal="true" 
        aria-label={label} 
        tabIndex={-1} 
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-2xl outline-none animate-in zoom-in-95 duration-200"
      >
        {children}
      </div>
    </div>
  );
}