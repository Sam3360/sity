import type {
  AuditReport,
  CategoryKey,
  Finding,
  FindingStatus,
} from "@/types/sity";

type DemoKey = "excellent" | "average" | "poor";

export const DEMO_PROFILES: {
  key: DemoKey;
  label: string;
  url: string;
  blurb: string;
}[] = [
  {
    key: "excellent",
    label: "Excellent site",
    url: "https://pixelandco.dev",
    blurb: "A carefully built studio site — near-perfect report.",
  },
  {
    key: "average",
    label: "Average site",
    url: "https://brightleafcoffee.com",
    blurb: "A real-world small-business site — decent, but unpolished.",
  },
  {
    key: "poor",
    label: "Poor site",
    url: "http://retro-arcade-hub.com",
    blurb: "An aging site with serious problems across the board.",
  },
];

/** Compact finding factory. */
function f(
  id: string,
  title: string,
  summary: string,
  status: FindingStatus,
  category: CategoryKey,
  impact: string,
  fix: string,
  details?: string,
): Finding {
  return { id, title, summary, status, category, impact, fix, details };
}

function scoreCategory(findings: Finding[], category: CategoryKey): number {
  const list = findings.filter((x) => x.category === category);
  if (list.length === 0) return 100;
  const weight = list.reduce(
    (sum, x) => sum + (x.status === "pass" ? 1 : x.status === "warn" ? 0.5 : 0),
    0,
  );
  return Math.round((weight / list.length) * 100);
}

function tally(list: Finding[]): { passed: number; warnings: number; failed: number } {
  return {
    passed: list.filter((x) => x.status === "pass").length,
    warnings: list.filter((x) => x.status === "warn").length,
    failed: list.filter((x) => x.status === "fail").length,
  };
}

// ---------------------------------------------------------------------
// Profile: excellent — pixelandco.dev
// ---------------------------------------------------------------------
const excellentFindings: Finding[] = [
  f("sec-https", "HTTPS enabled", "The site is served over a secure connection.", "pass", "security",
    "Encrypts traffic between visitors and the server.", "Nothing to do."),
  f("sec-mixed", "No mixed content", "All detected resources are loaded over https://.", "pass", "security",
    "Keeps the page fully secure and prevents browser warnings.", "Nothing to do."),
  f("sec-headers", "Security headers set", "Strict-Transport-Security, Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Referrer-Policy.", "pass", "security",
    "Hardens the site against common web attacks.", "Nothing to do."),
  f("sec-inline-handlers", "No inline event handlers", "Markup avoids inline on* attributes — CSP-friendly.", "pass", "security",
    "Keeps a Content Security Policy practical to enforce.", "Nothing to do."),
  f("perf-size", "HTML size: 46 KB", "Compact HTML document.", "pass", "performance",
    "Browsers download and parse every byte before the page turns interactive.", "Nothing to do."),
  f("perf-requests", "24 detected requests", "6 scripts, 3 stylesheets, 14 images.", "pass", "performance",
    "A lean request count keeps mobile load times low.", "Nothing to do."),
  f("perf-blocking", "No render-blocking scripts", "All head scripts are deferred, async, or modules.", "pass", "performance",
    "The browser can paint without waiting on scripts.", "Nothing to do."),
  f("perf-lazy", "Images use lazy loading", "12 of 14 images have loading=\"lazy\".", "pass", "performance",
    "Offscreen images defer, speeding up initial render.", "Nothing to do."),
  f("perf-ttfb", "Server response: 210 ms", "Fast server response.", "pass", "performance",
    "Visitors start loading the page almost immediately.", "Nothing to do."),
  f("a11y-alt", "All images have alt text", "14 images checked.", "pass", "accessibility",
    "Screen readers can describe images to non-sighted users.", "Nothing to do."),
  f("a11y-labels", "Form controls are labeled", "Newsletter input uses a proper <label>.", "pass", "accessibility",
    "Screen readers announce what each field is for.", "Nothing to do."),
  f("a11y-heading-order", "Heading structure is sequential", "h1 → h2 → h3, no skipped levels.", "pass", "accessibility",
    "Screen-reader users get a clean, navigable outline.", "Nothing to do."),
  f("a11y-contrast", "Contrast looks strong", "Simulated check — body text renders well above WCAG AA.", "pass", "accessibility",
    "Text stays readable for low-vision users and in sunlight.", "Nothing to do."),
  f("seo-title", "Page title looks good", "“Pixel & Co — Brand & web design studio” (39 chars)", "pass", "seo",
    "Titles are the primary search-result headline.", "Nothing to do."),
  f("seo-meta-desc", "Meta description is short", "44 characters", "warn", "seo",
    "Search engines may rewrite the snippet when the description is too short.", "Write a 50–160 character description summarizing the page."),
  f("seo-canonical", "Canonical URL declared", "<link rel=\"canonical\"> found.", "pass", "seo",
    "Consolidates duplicate URLs to one ranking page.", "Nothing to do."),
  f("seo-robots", "Indexable", "No noindex directive found.", "pass", "seo",
    "Search engines are free to index the page.", "Nothing to do."),
  f("seo-h1", "Single H1", "“Brand and web design for ambitious teams”", "pass", "seo",
    "A single H1 clarifies the page's main topic.", "Nothing to do."),
  f("bp-viewport", "Responsive viewport set", "width=device-width, initial-scale=1", "pass", "bestPractices",
    "The page scales correctly on phones and tablets.", "Nothing to do."),
  f("bp-deprecated", "No deprecated tags", "No <center>, <font>, or similar legacy elements.", "pass", "bestPractices",
    "Markup follows the current HTML standard.", "Nothing to do."),
  f("bp-favicon", "Favicon defined", "Icon plus apple-touch-icon present.", "pass", "bestPractices",
    "Shows a recognizable icon in tabs and bookmarks.", "Nothing to do."),
  f("bp-lang", "Language declared", "The <html> element declares lang=\"en\".", "pass", "bestPractices",
    "Screen readers pick the right pronunciation.", "Nothing to do."),
];

// ---------------------------------------------------------------------
// Profile: average — brightleafcoffee.com
// ---------------------------------------------------------------------
const averageFindings: Finding[] = [
  f("sec-https", "HTTPS enabled", "The site is served over a secure connection.", "pass", "security",
    "Encrypts traffic between visitors and the server.", "Nothing to do."),
  f("sec-mixed", "No mixed content", "All detected resources are loaded over https://.", "pass", "security",
    "Keeps the page fully secure.", "Nothing to do."),
  f("sec-headers", "Missing security headers (2)", "strict-transport-security, content-security-policy", "warn", "security",
    "Without HSTS browsers can be downgraded to http://; without CSP, XSS is harder to prevent.",
    "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains. Start CSP in report-only mode."),
  f("sec-inline-handlers", "Inline event handlers found", "The HTML uses inline on* attributes, which a strict CSP would block.", "warn", "security",
    "Inline handlers make a Content Security Policy much harder to adopt.",
    "Move event handling into external, deferred scripts."),
  f("perf-size", "HTML size: 118 KB", "Acceptable, but the document carries inline CSS and JS from a page builder.", "pass", "performance",
    "Larger documents take longer to download and parse.", "Move inline styles into a cached stylesheet."),
  f("perf-requests", "72 detected requests", "11 scripts, 5 stylesheets, 55 images.", "warn", "performance",
    "Every request adds latency, especially on mobile networks.",
    "Bundle scripts and styles; combine icons into a sprite."),
  f("perf-blocking", "Render-blocking scripts (3)", "Scripts in <head> without defer or async.", "fail", "performance",
    "These pause HTML parsing while they download and run, delaying first paint.",
    "Add the defer attribute, or move the scripts to the end of <body>."),
  f("perf-lazy", "Images not lazy-loaded", "3 of 55 images have loading=\"lazy\".", "warn", "performance",
    "The page waits on many offscreen images before it can settle.",
    "Add loading=\"lazy\" to below-the-fold <img> tags."),
  f("perf-ttfb", "Server response: 520 ms", "Acceptable server response.", "pass", "performance",
    "Room to breathe, but caching would make it snappier.",
    "Add CDN caching with sensible Cache-Control headers."),
  f("a11y-alt", "Missing alt text (2)", "2 of 55 images have no alt attribute.", "warn", "accessibility",
    "Screen-reader users can't tell what these images show.",
    "Add alt=\"\" for decorative images and descriptive alt for meaningful ones.",
    "/img/hero-beans.jpg\n/img/team-2019.jpg"),
  f("a11y-contrast", "Low-contrast text suspected", "Simulated check — light gray text on white in the footer.", "warn", "accessibility",
    "Faint text is hard to read for low-vision users.",
    "Darken footer text until it meets WCAG AA (4.5:1)."),
  f("a11y-labels", "Form controls are labeled", "Every input has an associated label.", "pass", "accessibility",
    "Screen readers announce what each field is for.", "Nothing to do."),
  f("a11y-heading-order", "Heading structure is sequential", "No skipped heading levels detected.", "pass", "accessibility",
    "Screen-reader users get a clean outline.", "Nothing to do."),
  f("seo-title", "Page title is very long", "“Bright Leaf Coffee Co. | Freshly Roasted Specialty Coffee Beans, Subscriptions, Brewing Gear & Gifts” (104 chars)", "warn", "seo",
    "Long titles get truncated in search results.",
    "Aim for a descriptive 15–65 character title."),
  f("seo-meta-desc", "Meta description present", "142 characters", "pass", "seo",
    "Gives search engines the snippet text under your result.", "Nothing to do."),
  f("seo-canonical", "No canonical URL", "Search engines must guess the preferred URL.", "warn", "seo",
    "Filter and campaign URLs can split ranking signals.",
    "Add <link rel=\"canonical\" href=\"…\"> to the <head>."),
  f("seo-robots", "Indexable", "No noindex directive found.", "pass", "seo",
    "Search engines are free to index the page.", "Nothing to do."),
  f("seo-h1", "Single H1", "“Small-batch coffee, roasted weekly”", "pass", "seo",
    "A single H1 clarifies the page's main topic.", "Nothing to do."),
  f("bp-viewport", "Responsive viewport set", "width=device-width, initial-scale=1", "pass", "bestPractices",
    "The page scales correctly on mobile.", "Nothing to do."),
  f("bp-deprecated", "No deprecated tags", "Markup is modern.", "pass", "bestPractices",
    "Follows the current HTML standard.", "Nothing to do."),
  f("bp-favicon", "Favicon defined", "A single .ico icon found.", "pass", "bestPractices",
    "Shows in tabs and bookmarks.", "Nothing to do."),
  f("bp-lang", "Language not declared", "The <html> element has no lang attribute.", "warn", "bestPractices",
    "Screen readers may mispronounce content; language detection is weaker.",
    "Add lang=\"en\" (or the page's language) to <html>."),
];

// ---------------------------------------------------------------------
// Profile: poor — retro-arcade-hub.com
// ---------------------------------------------------------------------
const poorFindings: Finding[] = [
  f("sec-https", "No HTTPS", "This page is served over plain http://.", "fail", "security",
    "Traffic can be read or modified in transit; browsers label the site “Not secure”.",
    "Get a TLS certificate (Let's Encrypt is free) and redirect all traffic to https://."),
  f("sec-mixed", "Mixed content", "1 resource loaded over http://.", "fail", "security",
    "Browsers may block the resource, and the page is treated as partially insecure.",
    "Load every resource over https:// once the certificate is in place.",
    "http://cdn.retro-arcade-hub.com/js/hits-counter.js"),
  f("sec-headers", "Missing security headers (5)", "strict-transport-security, content-security-policy, x-content-type-options, x-frame-options, referrer-policy", "fail", "security",
    "The site is exposed to clickjacking, MIME-sniffing, and downgrade attacks.",
    "Add the five standard security headers at the server or CDN level."),
  f("sec-inline-handlers", "Inline event handlers found", "12 inline on* attributes found in the markup.", "warn", "security",
    "Inline handlers conflict with any Content Security Policy.",
    "Move event handling into external, deferred scripts."),
  f("perf-size", "HTML size: 94 KB", "Document size is fine.", "pass", "performance",
    "The HTML itself parses quickly.", "Nothing to do."),
  f("perf-requests", "96 detected requests", "14 scripts, 6 stylesheets, 75 images.", "warn", "performance",
    "Dozens of requests multiply connection overhead.",
    "Bundle scripts/styles and lazy-load offscreen images."),
  f("perf-blocking", "Render-blocking scripts (5)", "Scripts in <head> without defer or async.", "fail", "performance",
    "Five scripts pause parsing before anything can paint.",
    "Add defer to head scripts, or move them to the end of <body>."),
  f("perf-lazy", "Images not lazy-loaded", "1 of 75 images have loading=\"lazy\".", "warn", "performance",
    "The page tries to fetch almost every image up front.",
    "Add loading=\"lazy\" to below-the-fold <img> tags."),
  f("perf-ttfb", "Server response: 470 ms", "Acceptable server response.", "pass", "performance",
    "The server responds reasonably fast despite the rest.", "Nothing to do."),
  f("a11y-alt", "Missing alt text (9)", "9 of 22 images have no alt attribute.", "fail", "accessibility",
    "Screen-reader users hit a wall of unnamed images.",
    "Add descriptive alt text, or alt=\"\" for decorative images.",
    "/img/game1.gif\n/img/game2.gif\n/img/banner88x31.gif …"),
  f("a11y-contrast", "Low-contrast text suspected", "Simulated check — yellow text on white background in several sections.", "warn", "accessibility",
    "Text is very hard to read for low-vision users.",
    "Use dark text on light backgrounds; meet WCAG AA (4.5:1)."),
  f("a11y-labels", "Unlabeled form controls (3)", "2 input(s), 1 textarea(s) without labels.", "fail", "accessibility",
    "Visitors using assistive tech can't tell what to type into the guestbook form.",
    "Associate a <label for> with each control, or add aria-label."),
  f("a11y-heading-order", "Heading structure is sequential", "No skipped heading levels detected.", "pass", "accessibility",
    "The outline is navigable, if sparse.", "Nothing to do."),
  f("seo-title", "No page title", "The document has no <title> element.", "fail", "seo",
    "Search results and browser tabs have nothing to show.",
    "Add a unique, descriptive <title> to the <head>."),
  f("seo-meta-desc", "No meta description", "Missing <meta name=\"description\">.", "fail", "seo",
    "Search engines will generate their own snippet, often badly.",
    "Add <meta name=\"description\" content=\"…\"> to the <head>."),
  f("seo-canonical", "No canonical URL", "Search engines must guess the preferred URL.", "warn", "seo",
    "www/non-www duplicates can split ranking signals.",
    "Add <link rel=\"canonical\" href=\"…\"> to the <head>."),
  f("seo-robots", "Indexable", "No noindex directive found.", "pass", "seo",
    "Search engines are free to index the page.", "Nothing to do."),
  f("seo-h1", "Multiple H1s (2)", "More than one <h1> was found.", "warn", "seo",
    "Dilutes the page's topical focus.",
    "Keep one H1; demote the others to h2/h3."),
  f("bp-viewport", "No responsive viewport meta", "Missing <meta name=\"viewport\">.", "fail", "bestPractices",
    "Mobile browsers render at desktop width and zoom out — text is unreadably small.",
    "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">."),
  f("bp-deprecated", "Deprecated HTML tags", "<center> ×14, <font> ×6, <marquee> ×1", "fail", "bestPractices",
    "These are removed from the HTML spec; rendering varies between browsers.",
    "Replace with CSS: text-align, font styling, and CSS animation."),
  f("bp-favicon", "No favicon", "No <link rel=\"icon\"> found.", "warn", "bestPractices",
    "Browsers fall back to a generic icon and may 404 on /favicon.ico.",
    "Add <link rel=\"icon\" href=\"/favicon.ico\"> to the <head>."),
  f("bp-lang", "Language not declared", "The <html> element has no lang attribute.", "warn", "bestPractices",
    "Screen readers may mispronounce content.",
    "Add lang=\"en\" (or the page's language) to <html>."),
];

const PROFILES: Record<
  DemoKey,
  {
    findings: Finding[];
    metrics: { pageSizeKb: number; requestCount: number; responseMs: number };
  }
> = {
  excellent: {
    findings: excellentFindings,
    metrics: { pageSizeKb: 46, requestCount: 24, responseMs: 210 },
  },
  average: {
    findings: averageFindings,
    metrics: { pageSizeKb: 118, requestCount: 72, responseMs: 520 },
  },
  poor: {
    findings: poorFindings,
    metrics: { pageSizeKb: 94, requestCount: 96, responseMs: 470 },
  },
};

export function isDemoKey(value: string | null): value is DemoKey {
  return value === "excellent" || value === "average" || value === "poor";
}

/** Build a complete demo report for the given profile. */
export function buildDemoReport(key: DemoKey): AuditReport {
  const profile = DEMO_PROFILES.find((p) => p.key === key) ?? DEMO_PROFILES[0];
  const { findings, metrics } = PROFILES[key];
  const performance = scoreCategory(findings, "performance");
  const accessibility = scoreCategory(findings, "accessibility");
  const seo = scoreCategory(findings, "seo");
  const security = scoreCategory(findings, "security");
  const bestPractices = scoreCategory(findings, "bestPractices");
  const overall = Math.round(
    performance * 0.25 + accessibility * 0.2 + seo * 0.2 + security * 0.2 + bestPractices * 0.15,
  );
  const meta = (id: string) => findings.find((x) => x.id === id);
  return {
    url: profile.url,
    finalUrl: profile.url,
    scannedAt: Date.now(),
    mode: "demo",
    demoProfileName: `${profile.label} — ${profile.url.replace(/^https?:\/\//, "")}`,
    scores: { overall, performance, accessibility, seo, security, bestPractices },
    metrics: {
      ...metrics,
      pageTitle: key === "poor" ? undefined : meta("seo-title")?.summary.match(/“(.+)”/)?.[1],
      metaDescription:
        key === "poor" ? undefined : "Simulated page description for the demo profile.",
    },
    findings,
  };
}

export { tally as tallyFindings };
