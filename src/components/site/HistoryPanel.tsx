import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatRelativeTime, scoreTone } from "@/utils/format";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import type { ScanHistoryEntry } from "@/types/sity";

interface HistoryPanelProps {
  entries: ScanHistoryEntry[];
  onOpenEntry: (entry: ScanHistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

export function HistoryPanel({ entries, onOpenEntry, onDeleteEntry, onClearHistory }: HistoryPanelProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="font-mono text-sm text-muted-foreground">no scans yet</p>
          <p className="text-xs text-muted-foreground/80">
            Scans you run are stored locally in your browser — refresh-proof and private.
          </p>
        </div>
        <div className="border-t border-border p-3">
          <Button variant="outline" size="sm" disabled className="w-full font-mono text-xs">
            clear history
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="flex-1">
        <ul className="divide-y divide-border">
          {entries.map((entry) => {
            const tone = scoreTone(entry.overall);
            return (
              <li key={entry.id} className="group flex items-center gap-3 px-4 py-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-8 shrink-0 place-items-center border font-mono text-xs font-bold",
                    tone === "pass" && "border-pass-soft status-pass bg-pass-soft/40",
                    tone === "warn" && "border-warn-soft status-warn bg-warn-soft/40",
                    tone === "fail" && "border-fail-soft status-fail bg-fail-soft/40",
                  )}
                >
                  {entry.overall}
                </span>
                <button
                  type="button"
                  onClick={() => onOpenEntry(entry)}
                  className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                >
                  <span className="w-full truncate font-mono text-sm hover:text-primary">
                    {entry.url.replace(/^https?:\/\//, "")}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(entry.scannedAt)} · {entry.mode === "demo" ? "demo report" : "live scan"}
                  </span>
                  <span className="sr-only">Open report for {entry.url}</span>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete scan of ${entry.url}`}
                  onClick={() => onDeleteEntry(entry.id)}
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="size-3.5 status-fail" />
                </Button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
      <div className="border-t border-border p-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearHistory}
          className="w-full font-mono text-xs"
        >
          clear history
        </Button>
      </div>
    </div>
  );
}
