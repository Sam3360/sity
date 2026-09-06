import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { scoreTone } from "@/utils/format";

interface ScoreRingProps {
  score: number;
  size?: number;
  label?: string;
  animate?: boolean;
  className?: string;
}

const COLOR: Record<"pass" | "warn" | "fail", string> = {
  pass: "var(--status-pass)",
  warn: "var(--status-warn)",
  fail: "var(--status-fail)",
};

/** Count-up hook, respects prefers-reduced-motion. */
function useCountUp(target: number, animate: boolean, duration = 900): number {
  const [value, setValue] = useState(animate ? 0 : target);
  useEffect(() => {
    if (!animate) {
      setValue(target);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animate, duration]);
  return value;
}

export function ScoreRing({ score, size = 160, label, animate = true, className }: ScoreRingProps) {
  const tone = scoreTone(score);
  const shown = useCountUp(score, animate);
  const stroke = 8;
  const r = (size - stroke) / 2 - 1;
  const c = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(100, shown));
  const dash = (progress / 100) * c;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden="true" className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={COLOR[tone]}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${c - dash}`}
            strokeLinecap="butt"
            style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-4xl font-bold leading-none"
            style={{ color: COLOR[tone] }}
          >
            {shown}
          </span>
          {label && (
            <span className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
