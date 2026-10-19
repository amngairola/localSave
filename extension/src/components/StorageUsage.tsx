import type { StorageUsage as Usage } from "../types/snippet";
import { formatBytes } from "../utils/formatBytes";

export function StorageUsage({ usage, error }: { usage: Usage | null; error: boolean }) {
  if (error) return <p className="text-[11px] text-muted">Storage usage unavailable.</p>;
  if (!usage) return null;
  const high = usage.percent >= 80;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-muted">
        <span>Storage: {formatBytes(usage.bytes)} of {formatBytes(usage.quota)}</span>
        <span className={high ? "text-warn" : ""}>~{usage.percent < 0.1 && usage.bytes > 0 ? "<0.1" : usage.percent.toFixed(1)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full ${high ? "bg-warn" : "bg-accent"}`} style={{ width: `${Math.max(usage.percent, usage.bytes ? 1 : 0)}%` }} />
      </div>
      {high && <p className="mt-1 text-[11px] text-warn">Storage is almost full. Export and remove old snippets.</p>}
    </div>
  );
}
