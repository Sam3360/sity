import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "./ScoreRing";
import { CategoryBars } from "./CategoryBars";
import { FindingGroups } from "./FindingGroups";
import { copyText, downloadReportJson, printReport } from "@/utils/export";
import { formatDate, prettyHost } from "@/utils/format";
import { toast } from "sonner";
import { Copy, Download, Printer, RotateCcw } from "lucide-react";
import type { AuditReport, CategoryResult } from "@/types/sity";

interface ReportViewProps {
  report: AuditReport;
  onScanAgain: () => void;
}

function toCategoryResults(report: AuditReport): CategoryResult[] {
  const keys = [
    { key: "performance", label: "Performance" },
    { key: "accessibility", label: "Accessibility" },
    { key: "seo", label: "SEO" },
    { key: "security", label: "Security" },
    { key: "bestPractices", label: "Best Practices" },
  ] as const;
  return keys.map(({ key, label }) => {
    const list = report.findings.filter((f) => f.category === key);
    return {
      key,
      label,
      score: report.scores[key],
      passed: list.filter((f) => f.status === "pass").length,
      warnings: list.filter((f) => f.status === "warn").length,
      failed: list.filter((f) => f.status === "fail").length,
    };
  });
}

export function ReportView({ report, onScanAgain }: ReportViewProps) {
  const categories = toCategoryResults(report);
  const isDemo = report.mode === "demo";
  const host = prettyHost(report.finalUrl || report.url);

  const handleCopy = async () => {
    const ok = await copyText(report.finalUrl || report.url);
    if (ok) {
      toast.success("URL copied to clipboard");
    } else {
      toast.error("Couldn't copy — your browser blocked clipboard access");
    }
  };

  const handleJson = () => {
    const ok = downloadReportJson(report);
    if (ok) {
      toast.success("Report JSON downloaded");
    } else {
      toast.error("Download failed — check your browser settings");
    }
  };

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Report header */}
      <header className="print-block">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-mono text-lg font-bold sm:text-xl">{host}</h1>
          <span
            className="border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider"
            style={{
              color: isDemo ? "var(--status-warn)" : "var(--status-pass)",
              borderColor: isDemo ? "var(--status-warn)" : "var(--status-pass)",
            }}
          >
            {isDemo ? "demo report — simulated" : "live scan"}
          </span>
        </div>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          {report.finalUrl} · scanned {formatDate(report.scannedAt)}
          {isDemo && report.demoProfileName ? ` · ${report.demoProfileName}` : ""}
        </p>
        {isDemo && (
          <p className="mt-2 border border-dashed border-warn-soft/60 bg-warn-soft/30 px-3 py-2 text-xs leading-relaxed status-warn">
            This is a simulated demo profile generated locally — not data from a real website.
            Run a live scan to audit a real URL.
          </p>
        )}
      </header>

      {/* Score summary */}
      <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-[auto_1fr_1fr] print-block">
        <div className="flex items-center justify-center bg-card p-6">
          <ScoreRing score={report.scores.overall} label="overall" size={168} />
        </div>
        <div className="bg-card p-6">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            category scores
          </h2>
          <CategoryBars categories={categories} />
        </div>
        <div className="bg-card p-6">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            measurements
          </h2>
          <dl className="space-y-2 font-mono text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">html size</dt>
              <dd className="tabular-nums">{report.metrics.pageSizeKb} KB</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">requests detected</dt>
              <dd className="tabular-nums">{report.metrics.requestCount}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">server response</dt>
              <dd className="tabular-nums">{report.metrics.responseMs} ms</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">title</dt>
              <dd className="max-w-[55%] truncate text-right" title={report.metrics.pageTitle}>
                {report.metrics.pageTitle ?? "— none —"}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">meta desc</dt>
              <dd className="max-w-[55%] truncate text-right" title={report.metrics.metaDescription}>
                {report.metrics.metaDescription ?? "— none —"}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground/80">
            Measured from Sity's cloud runtime against the fetched document. No headless browser
            is used — subresource bytes and runtime metrics aren't included.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={onScanAgain} className="gap-1.5 rounded-none font-mono text-xs">
          <RotateCcw className="size-3.5" /> scan again
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5 rounded-none font-mono text-xs">
          <Copy className="size-3.5" /> copy url
        </Button>
        <Button variant="outline" size="sm" onClick={handleJson} className="gap-1.5 rounded-none font-mono text-xs">
          <Download className="size-3.5" /> download json
        </Button>
        <Button variant="outline" size="sm" onClick={printReport} className="gap-1.5 rounded-none font-mono text-xs">
          <Printer className="size-3.5" /> print / save pdf
        </Button>
      </div>

      <Separator className="my-8" />

      {/* Findings */}
      <section aria-label="Audit findings">
        <h2 className="mb-4 font-mono text-sm text-muted-foreground">// findings</h2>
        <FindingGroups findings={report.findings} />
      </section>
    </article>
  );
}
