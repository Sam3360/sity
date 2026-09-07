import { cn } from "@/lib/utils";
import { FindingItem } from "./FindingItem";
import type { Finding } from "@/types/sity";

interface FindingGroupsProps {
  findings: Finding[];
}

function Group({
  tone,
  title,
  count,
  findings,
}: {
  tone: "fail" | "warn" | "pass";
  title: string;
  count: number;
  findings: Finding[];
}) {
  const meta = {
    fail: { glyph: "✕", cls: "status-fail", box: "bg-fail-soft/50 border-fail-soft/40", dot: "●" },
    warn: { glyph: "!", cls: "status-warn", box: "bg-warn-soft/50 border-warn-soft/40", dot: "●" },
    pass: { glyph: "✓", cls: "status-pass", box: "bg-pass-soft/50 border-pass-soft/40", dot: "●" },
  }[tone];

  return (
    <section className="border border-border bg-card print-block" aria-label={title}>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span aria-hidden="true" className={cn("font-mono text-xs", meta.cls)}>
          {meta.dot} {title}
        </span>
        <span className="font-mono text-xs text-muted-foreground">({count})</span>
      </div>
      {count === 0 ? (
        <p className="px-3 py-3 text-xs text-muted-foreground">
          {tone === "fail" && "Nothing failing — nice."}
          {tone === "warn" && "No warnings here."}
          {tone === "pass" && "Nothing passed yet on this scan."}
        </p>
      ) : (
        <ul className="m-0 list-none p-0">
          {findings.map((f) => (
            <FindingItem key={f.id} finding={f} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function FindingGroups({ findings }: FindingGroupsProps) {
  const failed = findings.filter((f) => f.status === "fail");
  const warned = findings.filter((f) => f.status === "warn");
  const passed = findings.filter((f) => f.status === "pass");

  return (
    <div className="space-y-6">
      <Group tone="fail" title="Needs attention" count={failed.length} findings={failed} />
      <Group tone="warn" title="Could improve" count={warned.length} findings={warned} />
      <Group tone="pass" title="Looking good" count={passed.length} findings={passed} />
    </div>
  );
}
