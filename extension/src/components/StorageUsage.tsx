import type { StorageUsage as Usage } from "../types/snippet";
import { formatBytes } from "../utils/formatBytes";

export function StorageUsage({ usage, error }: { usage: Usage | null; error: boolean }) {
  if (error) return <p className="text-[11px] text-muted">Storage usage unavailable.</p>;
  if (!usage) return null;
  const high = usage.percent >= 80;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-muted">
        <span>Storage: {formatBytes(usage.bytes)} / {formatBytes(usage.quota)}</span>
      </div>
       <div role="progressbar" aria-label="Storage usage" aria-valuenow={usage.percent} aria-valuemin={0} aria-valuemax={100} className="h-1 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full ${high ? "bg-warn" : "bg-accent"}`} style={{ width: `${Math.max(usage.percent, usage.bytes ? 1 : 0)}%` }} />
      </div>
      {high && <p className="mt-1 text-[11px] text-warn">Storage is almost full. Export and remove old snippets.</p>}
    </div>
  );
}
