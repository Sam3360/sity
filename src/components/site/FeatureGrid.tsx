import { cn } from "@/lib/utils";

const FEATURES = [
  {
    glyph: "▲",
    title: "Performance",
    desc: "HTML size, request count, render-blocking scripts, lazy-loading, server response time.",
  },
  {
    glyph: "◆",
    title: "Accessibility",
    desc: "Missing alt text, unlabeled form controls, heading structure and skipped levels.",
  },
  {
    glyph: "●",
    title: "SEO",
    desc: "Title and meta description lengths, canonical URL, robots directives, H1 focus.",
  },
  {
    glyph: "■",
    title: "Security",
    desc: "HTTPS, mixed content, and the five security headers that matter most.",
  },
  {
    glyph: "✦",
    title: "Best practices",
    desc: "Viewport, favicon, lang attribute, deprecated HTML — the hygiene checks.",
  },
  {
    glyph: "±",
    title: "Honest by design",
    desc: "Live scans run server-side on real HTML. Demo reports are simulated and clearly labeled.",
  },
] as const;

export function FeatureGrid() {
  return (
    <section aria-labelledby="features-heading" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <h2 id="features-heading" className="mb-1 font-mono text-sm text-muted-foreground">
        // what sity checks
      </h2>
      <div className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-card p-5 transition-colors hover:bg-accent/40">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="font-mono text-sm text-primary">{f.glyph}</span>
              <h3 className="font-mono text-sm font-semibold">{f.title}</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    { n: "01", text: "enter a URL" },
    { n: "02", text: "sity fetches the page server-side" },
    { n: "03", text: "checks run on markup + headers" },
    { n: "04", text: "you get a scored report" },
  ];
  return (
    <section aria-labelledby="how-heading" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <h2 id="how-heading" className="mb-1 font-mono text-sm text-muted-foreground">
        // how it works
      </h2>
      <ol className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <li key={s.n} className="bg-card p-4">
            <span className="font-mono text-[11px] text-primary">{s.n}</span>
            <p className="mt-1 font-mono text-xs">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function DemoStrip({ onDemo }: { onDemo: (key: string) => void }) {
  return (
    <section aria-labelledby="demo-heading" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <h2 id="demo-heading" className="mb-1 font-mono text-sm text-muted-foreground">
        // demo scans — simulated, clearly labeled
      </h2>
      <div className="mt-4 grid gap-px border border-border bg-border sm:grid-cols-3">
        {DEMO_STRIP_ITEMS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onDemo(p.key)}
            className="group bg-card p-5 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-inset"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm font-semibold group-hover:text-primary">{p.label}</span>
              <span className={cn("font-mono text-2xl font-bold", p.tone)}>{p.score}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{p.blurb}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

const DEMO_STRIP_ITEMS = [
  { key: "excellent", label: "pixelandco.dev", score: 96, tone: "status-pass", blurb: "Careful studio site — near-perfect report." },
  { key: "average", label: "brightleafcoffee.com", score: 74, tone: "status-warn", blurb: "Real-world small business — decent, unpolished." },
  { key: "poor", label: "retro-arcade-hub.com", score: 46, tone: "status-fail", blurb: "Aging site with problems everywhere." },
];
