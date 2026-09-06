import { useNavigate } from "react-router";
import { ScanForm } from "@/components/scan/ScanForm";
import { DemoStrip, FeatureGrid, HowItWorks } from "@/components/site/FeatureGrid";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useScanHistory } from "@/hooks/use-scan-history";
import { scoreTone } from "@/utils/format";
import { cn } from "@/lib/utils";

export default function Landing() {
  const navigate = useNavigate();
  const { entries, addReport, removeEntry, clearHistory } = useScanHistory();

  const handleScan = (input: string, mode: "real" | "demo", demoKey?: string) => {
    if (mode === "demo" && demoKey) {
      navigate(`/report?demo=${demoKey}`);
      return;
    }
    navigate(`/report?url=${encodeURIComponent(input)}`);
  };

  const openEntry = (entryId: string) => navigate(`/report?h=${entryId}`);

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        entries={entries}
        onOpenEntry={(e) => openEntry(e.id)}
        onDeleteEntry={removeEntry}
        onClearHistory={clearHistory}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative border-b border-border">
          <div className="grid-blueprint pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="mb-3 font-mono text-xs text-muted-foreground">
              $ sity --health-check <span className="blink-caret text-primary">▊</span>
            </p>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Find what's wrong with your site. <span className="text-primary">Fast.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Sity runs a quick health check on any public URL — performance, accessibility,
              SEO, security, and best practices — and returns one honest score with the fixes
              that matter.
            </p>

            <div className="mt-8 max-w-2xl">
              <ScanForm onScan={handleScan} isScanning={false} />
            </div>

            <div className="mt-10 max-w-2xl">
              {/* Decorative sample output */}
              <div className="terminal-surface scanlines border border-border bg-muted/70">
                <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
                  <span className="font-mono text-[11px] text-muted-foreground">sity — sample output</span>
                  <span className="font-mono text-[11px] text-muted-foreground">example.com</span>
                </div>
                <div className="space-y-1 px-3 py-3 font-mono text-xs leading-relaxed">
                  <p className="m-0 text-muted-foreground">$ sity scan example.com</p>
                  <p className="m-0">✓ https enabled <span className="text-muted-foreground">· ✓ viewport · ✓ favicon</span></p>
                  <p className="m-0 status-warn">! missing security headers (2)</p>
                  <p className="m-0 status-fail">✕ no meta description</p>
                  <p className="m-0">
                    overall <span className={cn("font-bold", scoreToneText(87))}>87/100</span>
                    <span className="text-muted-foreground"> — 5 checks failed, 4 could improve</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent scans strip */}
        {entries.length > 0 && (
          <section aria-labelledby="recent-heading" className="border-b border-border bg-card/50">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
              <h2 id="recent-heading" className="mb-3 font-mono text-sm text-muted-foreground">
                // your recent scans
              </h2>
              <ul className="flex flex-wrap gap-2">
                {entries.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => openEntry(e.id)}
                      className="flex items-center gap-2 border border-border bg-card px-3 py-1.5 font-mono text-xs transition-colors hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <span
                        className={cn(
                          "font-bold",
                          scoreTone(e.overall) === "pass" && "status-pass",
                          scoreTone(e.overall) === "warn" && "status-warn",
                          scoreTone(e.overall) === "fail" && "status-fail",
                        )}
                      >
                        {e.overall}
                      </span>
                      <span className="max-w-[180px] truncate">{e.url.replace(/^https?:\/\//, "")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <div className="space-y-14 py-14">
          <FeatureGrid />
          <HowItWorks />
          <DemoStrip onDemo={(key) => handleScan("", "demo", key)} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function scoreToneText(score: number): string {
  const tone = scoreTone(score);
  return tone === "pass" ? "status-pass" : tone === "warn" ? "status-warn" : "status-fail";
}
