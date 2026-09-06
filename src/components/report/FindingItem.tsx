import { useId, useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusGlyph, statusLabel } from "@/utils/format";
import type { Finding } from "@/types/sity";

interface FindingItemProps {
  finding: Finding;
  /** Default open state (used when rendering expanded groups). */
  defaultOpen?: boolean;
}

const STATUS_STYLES: Record<Finding["status"], { glyph: string; cls: string; box: string }> = {
  pass: { glyph: "✓", cls: "status-pass", box: "bg-pass-soft/50 border-pass-soft/40" },
  warn: { glyph: "!", cls: "status-warn", box: "bg-warn-soft/50 border-warn-soft/40" },
  fail: { glyph: "✕", cls: "status-fail", box: "bg-fail-soft/50 border-fail-soft/40" },
};

export function FindingItem({ finding, defaultOpen = false }: FindingItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = useId();
  const headerId = useId();
  const s = STATUS_STYLES[finding.status];

  return (
    <li className="border-b border-border last:border-b-0 print-block">
      <h4 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <span
            aria-hidden="true"
            className={cn("grid size-5 shrink-0 place-items-center border font-mono text-[10px] font-bold", s.cls, s.box)}
          >
            {s.glyph}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-mono text-sm">{finding.title}</span>
            <span className="block truncate text-xs text-muted-foreground">{finding.summary}</span>
          </span>
          <span className={cn("shrink-0 font-mono text-[10px] uppercase", s.cls)}>{statusLabel(finding.status)}</span>
          <ChevronRight
            aria-hidden="true"
            className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
          />
        </button>
      </h4>
      <div id={bodyId} role="region" aria-labelledby={headerId} hidden={!open} data-detail-body>
        <div className="space-y-2 border-t border-dashed border-border/70 px-3 py-3 text-xs leading-relaxed">
          <p>
            <span className="mr-1.5 font-mono font-semibold status-info">what:</span>
            {finding.summary}
          </p>
          <p>
            <span className="mr-1.5 font-mono font-semibold status-warn">why it matters:</span>
            {finding.impact}
          </p>
          <p>
            <span className="mr-1.5 font-mono font-semibold status-pass">how to fix:</span>
            {finding.fix}
          </p>
          {finding.details && (
            <pre className="overflow-x-auto rounded-sm border border-border bg-muted/60 p-2 font-mono text-[11px] whitespace-pre-wrap">
              {finding.details}
            </pre>
          )}
        </div>
      </div>
    </li>
  );
}
