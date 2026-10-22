import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", variant = "ghost", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost" | "primary" | "danger" }) {
  const tone = variant === "primary" 
    ? "bg-[var(--color-accent)] text-[var(--color-accent-fg)] shadow-sm hover:opacity-90" 
    : variant === "danger" 
    ? "bg-[var(--color-danger)] text-white shadow-sm hover:opacity-90" 
    : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]";
    
  return (
    <button 
      type="button" 
      {...props} 
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-40 ${tone}${className}`} 
    />
  );
}