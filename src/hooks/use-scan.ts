import { useCallback, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { AuditError, AuditReport } from "@/types/sity";
import { buildDemoReport, isDemoKey } from "@/lib/demoProfiles";
import { parseScanInput, toAuditError } from "@/utils/url";

export type ScanPhase = "idle" | "scanning" | "done" | "error";

const REAL_SCAN_STEPS = [
  "Resolving host…",
  "Connecting…",
  "Requesting document…",
  "Reading response…",
  "Analyzing markup…",
  "Checking headers…",
  "Grading checks…",
  "Compiling report…",
];

const DEMO_SCAN_STEPS = [
  "Loading demo profile…",
  "Simulating fetch…",
  "Analyzing markup…",
  "Grading checks…",
  "Compiling report…",
];

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
void makeId;

export function useScan() {
  const scanUrlAction = useAction(api.audit.scanUrl);
  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<AuditError | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const timersRef = useRef<number[]>([]);
  const scanIdRef = useRef(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    scanIdRef.current += 1;
    setPhase("idle");
    setReport(null);
    setError(null);
    setLogs([]);
    setActiveStep(0);
  }, [clearTimers]);

  const runScan = useCallback(
    async (rawInput: string, mode: "real" | "demo", demoKey?: string) => {
      clearTimers();
      scanIdRef.current += 1;
      const scanId = scanIdRef.current;

      setReport(null);
      setError(null);
      setPhase("scanning");

      // Demo path: fully local, staged steps with honest "Simulating" labels.
      if (mode === "demo") {
        const steps = DEMO_SCAN_STEPS;
        setLogs([`$ sity scan --demo ${demoKey ?? "average"}`]);
        steps.forEach((step, i) => {
          const t = window.setTimeout(() => {
            if (scanIdRef.current !== scanId) return;
            setActiveStep(i);
            setLogs((prev) => [...prev, step]);
          }, 450 + i * 380);
          timersRef.current.push(t);
        });

        const total = 450 + steps.length * 380 + 350;
        const t = window.setTimeout(() => {
          if (scanIdRef.current !== scanId) return;
          const key = demoKey ?? "";
          if (!isDemoKey(key)) {
            setError({
              code: "UNKNOWN",
              title: "Unknown demo profile",
              message: "That demo profile doesn't exist.",
              hint: "Pick one of the three demo sites on the report page.",
            });
            setPhase("error");
            return;
          }
          const demo = buildDemoReport(key);
          setReport(demo);
          setPhase("done");
        }, total);
        timersRef.current.push(t);
        return;
      }

      // Real path: validate input client-side first.
      const parsed = parseScanInput(rawInput);
      if (parsed.error) {
        setError({
          code: parsed.error.code,
          title:
            parsed.error.code === "EMPTY_INPUT"
              ? "Enter a URL first"
              : parsed.error.code === "UNSUPPORTED_PROTOCOL"
                ? "Unsupported address"
                : "That URL doesn't look right",
          message: parsed.error.message,
          hint: parsed.error.hint ?? "Try something like example.com or https://developer.mozilla.org",
        });
        setPhase("error");
        return;
      }

      const target = parsed.url!;
      setLogs([`$ sity scan ${target}`]);
      REAL_SCAN_STEPS.forEach((step, i) => {
        const t = window.setTimeout(() => {
          if (scanIdRef.current !== scanId) return;
          setActiveStep(i);
          setLogs((prev) => [...prev, step]);
        }, i * 450);
        if (i * 450 < 8_000) timersRef.current.push(t);
      });

      try {
        const result = await scanUrlAction({ url: target });
        if (scanIdRef.current !== scanId) return;
        clearTimers();
        setLogs((prev) => [
          ...prev,
          `Received ${result.metrics.pageSizeKb} KB in ${result.metrics.responseMs} ms`,
          `Report ready — overall score ${result.scores.overall}/100`,
        ]);
        setReport(result);
        setPhase("done");
      } catch (err) {
        if (scanIdRef.current !== scanId) return;
        clearTimers();
        setError(toAuditError(err));
        setPhase("error");
      }
    },
    [scanUrlAction, clearTimers],
  );

  return { phase, report, error, logs, activeStep, runScan, reset };
}
