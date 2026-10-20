import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", variant = "ghost", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ghost" | "primary" | "danger" }) {
  const tone = variant === "primary" ? "bg-accent text-accent-fg hover:brightness-110" : variant === "danger" ? "bg-danger text-accent-fg hover:brightness-110" : "text-muted hover:bg-surface-2 hover:text-fg";
  return <button type="button" {...props} className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40 ${tone} ${className}`} />;
}