import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ScanConsoleProps {
  logs: string[];
  activeStep: number;
  stepCount: number;
  mode: "real" | "demo";
}

export function ScanConsole({ logs, activeStep, stepCount, mode }: ScanConsoleProps) {
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const progress = Math.min(100, Math.round(((activeStep + 1) / stepCount) * 100));

  return (
    <div className="terminal-surface scanlines border border-border bg-muted/70 print:hidden" aria-live="polite" aria-busy="true">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-[11px] text-muted-foreground">
          {mode === "demo" ? "sity — demo run" : "sity — live scan"}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">{progress}%</span>
      </div>
      <div
        ref={boxRef}
        className="h-40 overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed"
      >
        {logs.map((line, i) => (
          <p key={i} className={cn("m-0", i === logs.length - 1 && "blink-caret")}>
            <span className="mr-2 text-muted-foreground/70 select-none">{i === 0 ? "$" : ">"}</span>
            {line.replace(/^\$\s*/, "")}
          </p>
        ))}
      </div>
      <div className="h-0.5 w-full bg-border/60">
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
