import type { AuditReport } from "@/types/sity";
import { prettyHost } from "./format";

export function buildReportJson(report: AuditReport): string {
  return JSON.stringify(
    {
      tool: "Sity",
      tagline: "A quick health check for your site.",
      exportedAt: new Date().toISOString(),
      mode: report.mode,
      url: report.url,
      finalUrl: report.finalUrl,
      scannedAt: new Date(report.scannedAt).toISOString(),
      demoProfileName: report.demoProfileName,
      scores: report.scores,
      metrics: report.metrics,
      findings: report.findings.map((f) => ({
        id: f.id,
        title: f.title,
        summary: f.summary,
        status: f.status,
        category: f.category,
        impact: f.impact,
        fix: f.fix,
        details: f.details,
      })),
    },
    null,
    2,
  );
}

/** Trigger a client-side JSON download of the report. */
export function downloadReportJson(report: AuditReport): boolean {
  try {
    const blob = new Blob([buildReportJson(report)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const host = prettyHost(report.finalUrl || report.url).replace(/[^\w.-]+/g, "-");
    const a = document.createElement("a");
    a.href = url;
    a.download = `sity-report-${host}-${new Date(report.scannedAt).toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error("Sity: JSON export failed:", err);
    return false;
  }
}

/** Open the browser print dialog — users save as PDF from there. */
export function printReport(): void {
  try {
    window.print();
  } catch (err) {
    console.error("Sity: print failed:", err);
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
