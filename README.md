# Sity

**A quick health check for your site.**

Sity is a website auditing and developer utility. Enter a public URL, get a clean,
understandable report: one overall score, five category scores, and findings that explain
what was detected, why it matters, and how to fix it.

```
$ sity scan example.com
✓ https enabled
! missing security headers (2)
✕ no meta description
overall 74/100 — 5 failed, 4 could improve
```

## Features

- **Live scans of real URLs** — the page is fetched server-side (no CORS problems) and
  analyzed: performance, accessibility, SEO, security, and best practices.
- **One combined score** plus per-category breakdowns (0–100).
- **Prioritized findings** grouped into 🔴 Needs attention, 🟡 Could improve,
  🟢 Looking good. Each expands to show detection, impact, fix, and technical details.
- **Demo mode** — three simulated profiles (excellent ~95, average ~75, poor ~45) so the
  full experience works without any external site. Clearly labeled as demo everywhere.
- **Scan history** — stored locally in your browser (localStorage), open/delete/clear,
  survives refresh. No account required.
- **Export** — download the report as JSON or use print / save-as-PDF with a dedicated
  print layout.
- **Light/dark theme**, responsive down to mobile, keyboard-accessible, reduced-motion
  aware.

## What's real vs. demo

| | Real scan | Demo scan |
|---|---|---|
| Data source | The actual HTML + HTTP response headers of the URL you enter, fetched by a Convex action | Hand-authored simulated profiles generated locally in your browser |
| Labeling | "live scan" badge | "demo report — simulated" badge + notice in the report header |
| Finds | Alt text, form labels, heading structure, title/meta lengths, canonical, robots, viewport, favicon, lang, deprecated tags, HTTPS, mixed content, five security headers, HTML size, request count, render-blocking scripts, lazy-loading, server response time | Same categories, representative results that always render |

**Honest limitations (not faked):**

- No headless browser is used, so runtime-only metrics (rendered DOM, computed contrast,
  console errors, actual transferred bytes) are out of scope. The UI states this.
- "Server response" is measured from Sity's cloud runtime, not your network.
- Color contrast findings in demo profiles are simulated; the real scanner doesn't
  compute contrast (it can't see rendered styles).

## Architecture

```
src/
  convex/
    audit.ts          # scanUrl action: fetch + score + build report (Node runtime)
    auditChecks.ts    # pure HTML/header check helpers (regex-based, no deps)
  components/
    report/           # ScoreRing, CategoryBars, FindingItem, FindingGroups, ReportView
    scan/             # ScanForm, ScanConsole (staged terminal output)
    site/             # Header (history sheet, theme toggle), Footer, HistoryPanel, FeatureGrid
  hooks/
    use-scan.ts       # orchestration: real action vs demo, staged logs, error mapping
    use-scan-history.ts # localStorage persistence
    use-theme.ts      # light/dark toggle, persisted
  lib/
    demoProfiles.ts   # 3 demo profiles, score math shared with real engine
  pages/
    Landing.tsx       # hero, scan form, features, demo strip
    Report.tsx        # scanning/error/report states, deep links (?url= ?demo= ?h=)
  types/sity.ts       # AuditReport, Finding, etc. (shared client + server)
  utils/
    url.ts            # input validation + friendly error mapping
    format.ts         # score tones, glyphs, dates
    export.ts         # JSON download, print, clipboard
```

The scan flow: `Landing` → navigates to `/report?url=…` (or `?demo=…`) → `Report` page
calls `useScan().runScan` → real scans invoke the `audit.scanUrl` Convex action; demo
scans build a local profile after staged delays → `ReportView` renders the `AuditReport`
→ the report is saved to scan history.

## Installation

Requires [Bun](https://bun.sh) and a Convex deployment (the template provisions one).

```bash
bun install
bun convex dev --once   # generate Convex types + push functions
bun run dev
```

## Development

```bash
bun run dev        # Vite dev server (HMR is intentionally disabled by the platform)
bun tsc -b --noEmit  # typecheck
```

## Production build

```bash
bun run build
```

## Environment variables

None are required. The Convex client URL (`VITE_CONVEX_URL`) is provided by the
hosting platform automatically, and all checks run on public data — there are no
API keys or secrets. A `.env.example` is not needed for the same reason.

## Known browser limitations

- Sity cannot execute the target site's JavaScript, so client-rendered (SPA) content
  only shows what the raw server response contains.
- Cross-origin restrictions mean a browser alone can't fetch other sites — that's why
  the fetch runs server-side.
- Scan history is per-browser (localStorage). Clearing site data clears history.
- Sites behind bot protection may refuse the scan; Sity reports this as a friendly
  "site refused our request" error instead of fake data.

## Future roadmap

- Optional headless-browser checks (Lighthouse-style metrics) behind a queue.
- sitemap.xml / robots.txt fetching with crawl hints.
- XML/HTML sitemap presence, Open Graph / Twitter card previews.
- Custom user agents and mobile viewport emulation.
- Shareable report links (server-persisted) alongside local history.
- CSV export and a public JSON API.
