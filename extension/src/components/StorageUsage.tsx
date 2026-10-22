import type { StorageUsage as Usage } from "../types/snippet";
import { formatBytes } from "../utils/formatBytes";

export function StorageUsage({ usage, error }: { usage: Usage | null; error: boolean }) {
  if (error) return <p className="text-xs font-medium text-[var(--color-danger)]">Storage usage unavailable.</p>;
  if (!usage) return null;
  const high = usage.percent >= 80;
  
  return (
    <div className="w-full max-w-xs">
      <div className="mb-1.5 flex justify-between text-xs font-medium text-[var(--color-muted)]">
        <span>Vault Storage</span>
        <span>{formatBytes(usage.bytes)} / {formatBytes(usage.quota)}</span>
      </div>
       <div 
        role="progressbar" 
        aria-label="Storage usage" 
        aria-valuenow={usage.percent} 
        aria-valuemin={0} 
        aria-valuemax={100} 
        className="h-1.5 overflow-hidden rounded-full bg-[var(--color-bg)] border border-[var(--color-line)]"
      >
        <div 
          className={`h-full rounded-full transition-all duration-500 ${high ? "bg-[var(--color-danger)]" : "bg-[var(--color-accent)]"}`} 
          style={{ width: `${Math.max(usage.percent, usage.bytes ? 1 : 0)}%` }} 
        />
      </div>
      {high && <p className="mt-2 text-xs font-medium text-[var(--color-danger)]">Storage is almost full. Export and clear old notes.</p>}
    </div>
  );
}