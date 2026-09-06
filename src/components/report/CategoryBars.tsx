import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CategoryResult } from "@/types/sity";

interface CategoryBarsProps {
  categories: CategoryResult[];
}

const TONE_VAR: Record<"pass" | "warn" | "fail", string> = {
  pass: "var(--status-pass)",
  warn: "var(--status-warn)",
  fail: "var(--status-fail)",
};

export function CategoryBars({ categories }: CategoryBarsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <ul className="space-y-3" aria-label="Category scores">
      {categories.map((cat) => {
        const tone = cat.score >= 90 ? "pass" : cat.score >= 50 ? "warn" : "fail";
        return (
          <li key={cat.key} className="print-block">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">{cat.label}</span>
              <span className="font-mono text-xs tabular-nums" style={{ color: TONE_VAR[tone] }}>
                {cat.score}
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-none bg-muted"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={cat.score}
              aria-label={`${cat.label} score ${cat.score} out of 100`}
            >
              <div
                className="h-full"
                style={{
                  width: mounted ? `${cat.score}%` : "0%",
                  backgroundColor: TONE_VAR[tone],
                  transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </div>
            <div className="mt-1 flex gap-3 text-[10px] font-mono text-muted-foreground">
              <span className="status-pass">{cat.passed} passed</span>
              <span className="status-warn">{cat.warnings} warnings</span>
              <span className="status-fail">{cat.failed} failed</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
