import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router";
import { ScanConsole } from "@/components/scan/ScanConsole";
import { ScanForm } from "@/components/scan/ScanForm";
import { ReportView } from "@/components/report/ReportView";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useScan } from "@/hooks/use-scan";
import { useScanHistory } from "@/hooks/use-scan-history";
import { DEMO_PROFILES } from "@/lib/demoProfiles";
import { formatDate } from "@/utils/format";
import type { AuditReport } from "@/types/sity";

export default function Report() {
  const [params, setParams] = useSearchParams();
  const { phase, report, error, logs, activeStep, runScan, reset } = useScan();
  const { entries, addReport, removeEntry, clearHistory } = useScanHistory();

  const urlParam = params.get("url");
  const demoParam = params.get("demo");
  const historyId = params.get("h");

  const historyEntry = useMemo(
    () => entries.find((e) => e.id === historyId),
    [entries, historyId],
  );

  // Kick off scans from URL params once per param change.
  const startedKeyRef = useRef<string>("");
  useEffect(() => {
    if (historyId) return; // viewing a saved report — don't rescan
    const key = `${demoParam ?? ""}|${urlParam ?? ""}`;
    if (!demoParam && !urlParam) return;
    if (startedKeyRef.current === key) return;
    startedKeyRef.current = key;
    if (demoParam) {
      void runScan("", "demo", demoParam);
    } else if (urlParam) {
      void runScan(urlParam, "real");
    }
  }, [demoParam, urlParam, historyId, runScan]);

  // Persist new reports to history when a scan completes.
  const savedRef = useRef<AuditReport | null>(null);
  useEffect(() => {
    if (report && savedRef.current !== report) {
      savedRef.current = report;
      addReport(report);
    }
  }, [report, addReport]);

  const displayReport = historyEntry ? historyEntry.report : report;

  const handleScanAgain = useCallback(() => {
    if (!displayReport) return;
    reset();
    if (displayReport.mode === "demo") {
      const match = DEMO_PROFILES.find((p) => p.url === displayReport.url);
      const demo = match?.key ?? "average";
      startedKeyRef.current = `${demo}|`;
      setParams({ demo });
      void runScan("", "demo", demo);
    } else {
      const u = displayReport.url;
      startedKeyRef.current = `|${u}`;
      setParams({ url: u });
      void runScan(u, "real");
    }
  }, [displayReport, reset, runScan, setParams]);

  const handleFormScan = useCallback(
    (input: string, mode: "real" | "demo", demoKey?: string) => {
      reset();
      if (mode === "demo" && demoKey) {
        startedKeyRef.current = `${demoKey}|`;
        setParams({ demo: demoKey });
        void runScan("", "demo", demoKey);
      } else {
        startedKeyRef.current = `|${input}`;
        setParams({ url: input });
        void runScan(input, "real");
      }
    },
    [reset, runScan, setParams],
  );

  useEffect(() => {
    if (displayReport) window.scrollTo({ top: 0 });
  }, [displayReport]);

  const stepCount = demoParam ? DEMO_STEPS : REAL_STEPS;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        entries={entries}
        onOpenEntry={(e) => {
          reset();
          setParams({ h: e.id });
        }}
        onDeleteEntry={removeEntry}
        onClearHistory={clearHistory}
      />

      {/* Print-only report header */}
      <div className="hidden print-header print:block p-8">
        <p className="font-mono text-sm font-bold">sity — website health check</p>
        {displayReport && (
          <p className="font-mono text-xs">
            {displayReport.finalUrl} · scanned {formatDate(displayReport.scannedAt)}
            {displayReport.mode === "demo" ? " · demo report (simulated)" : " · live scan"}
          </p>
        )}
      </div>

      <main className="flex-1">
        {phase === "scanning" && (
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
            <h1 className="font-mono text-lg font-bold">
              {demoParam ? "Running demo scan…" : "Scanning…"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {demoParam
                ? "Generating a simulated report locally."
                : "Fetching and analyzing the page server-side."}
            </p>
            <div className="mt-6">
              <ScanConsole
                logs={logs}
                activeStep={activeStep}
                stepCount={stepCount}
                mode={demoParam ? "demo" : "real"}
              />
            </div>
          </div>
        )}

        {phase === "error" && error && (
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
            <div className="border border-fail-soft/40 bg-fail-soft/20 p-6">
              <h1 className="font-mono text-lg font-bold status-fail">✕ {error.title}</h1>
              <p className="mt-2 text-sm">{error.message}</p>
              {error.hint && <p className="mt-1 text-xs text-muted-foreground">{error.hint}</p>}
              <div className="mt-5">
                <ScanForm onScan={handleFormScan} isScanning={false} initialUrl={demoParam ? "" : urlParam ?? ""} />
              </div>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Tip: some sites block automated scanners entirely. The demo scans show what a full
              report looks like.
            </p>
          </div>
        )}

        {displayReport && phase !== "scanning" && phase !== "error" && (
          <ReportView report={displayReport} onScanAgain={handleScanAgain} />
        )}

        {phase === "idle" && !displayReport && !historyEntry && (
          <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
            <h1 className="font-mono text-lg font-bold">run a scan</h1>
            <p className="mt-1 text-xs text-muted-foreground">Enter a public URL to audit.</p>
            <div className="mt-6">
              <ScanForm onScan={handleFormScan} isScanning={false} initialUrl={urlParam ?? ""} />
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

const DEMO_STEPS = 5;
const REAL_STEPS = 8;
