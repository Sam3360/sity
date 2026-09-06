import { Button } from "@/components/ui/button";
import { ScanForm } from "@/components/scan/ScanForm";
import { DemoStrip, FeatureGrid } from "@/components/site/FeatureGrid";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { useAuth } from "@/hooks/use-auth";
import { useScanHistory } from "@/hooks/use-scan-history";
import { formatRelativeTime, scoreTone } from "@/utils/format";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";
import type { ScanHistoryEntry } from "@/types/sity";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { entries, removeEntry, clearHistory } = useScanHistory();

  const handleScan = (input: string, mode: "real" | "demo", demoKey?: string) => {
    if (mode === "demo" && demoKey) {
      navigate(`/report?demo=${demoKey}`);
      return;
    }
    navigate(`/report?url=${encodeURIComponent(input)}`);
  };

  const openEntry = (entry: ScanHistoryEntry) => navigate(`/report?h=${entry.id}`);

  const avgScore =
    entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.overall, 0) / entries.length)
      : null;

  const liveScans = entries.filter((e) => e.mode === "real").length;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        entries={entries}
        onOpenEntry={openEntry}
        onDeleteEntry={removeEntry}
        onClearHistory={clearHistory}
      />

      <main className="flex-1">
        {/* Workspace header + quick scan */}
        <section className="relative border-b border-border">
          <div className="grid-blueprint pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-muted-foreground">~/workspace</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  Welcome{user?.name ? `, ${user.name}` : ""}_
                </h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Run a new health check or revisit a saved report.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                className="gap-2 rounded-none font-mono text-xs"
              >
                sign out
              </Button>
            </div>

            <div className="mt-8 max-w-2xl">
              <ScanForm onScan={handleScan} isScanning={false} />
            </div>
          </div>
        </section>

        {/* Stats */}
        <section aria-label="Scan stats" className="border-b border-border bg-card/50">
          <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-border px-0 sm:max-w-none sm:grid-cols-3">
            <Stat label="total scans" value={entries.length} />
            <Stat label="live scans" value={liveScans} />
            <Stat
              label="avg score"
              value={avgScore != null ? `${avgScore}` : "—"}
              tone={avgScore != null ? scoreTone(avgScore) : undefined}
            />
          </div>
        </section>

        {/* Full history */}
        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
          <h2 className="font-mono text-sm text-muted-foreground">// scan history</h2>
          {entries.length === 0 ? (
            <div className="mt-4 border border-dashed border-border bg-card/40 p-8 text-center">
              <p className="font-mono text-sm text-muted-foreground">no scans yet</p>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground/80">
                Reports you run are saved here — stored locally in your browser,
                refresh-proof and private. Try a demo scan below to see a full report.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border border border-border bg-card">
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
                      onClick={() => openEntry(entry)}
                      className="flex min-w-0 flex-1 flex-col items-start gap-0.5 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <span className="w-full truncate font-mono text-sm hover:text-primary">
                        {entry.url.replace(/^https?:\/\//, "")}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(entry.scannedAt)} ·{" "}
                        {entry.mode === "demo" ? "demo report (simulated)" : "live scan"}
                      </span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEntry(entry)}
                      className="shrink-0 rounded-none font-mono text-xs"
                    >
                      open
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete scan of ${entry.url}`}
                      onClick={() => removeEntry(entry.id)}
                      className="shrink-0 rounded-none font-mono text-xs status-fail"
                    >
                      ✕
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="space-y-14 pb-14">
          <FeatureGrid />
          <DemoStrip onDemo={(key) => handleScan("", "demo", key)} />
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "pass" | "warn" | "fail" }) {
  return (
    <div className="bg-card px-4 py-5 sm:px-6">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-bold tabular-nums",
          tone === "pass" && "status-pass",
          tone === "warn" && "status-warn",
          tone === "fail" && "status-fail",
        )}
      >
        {value}
      </p>
    </div>
  );
}
