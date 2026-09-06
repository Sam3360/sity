"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import type { AuditReport, CategoryKey, Finding } from "../types/sity";
import {
  countDeprecatedTags,
  countExternalResources,
  countLazyImages,
  countRenderBlockingScripts,
  findControlsWithoutLabels,
  findFavicon,
  findHeadingSkips,
  findImagesWithoutAlt,
  findInsecureResources,
  getFirstH1,
  getH1Count,
  getMetaContents,
  getTitle,
  htmlByteLength,
  type PageFetch,
} from "./auditChecks";

const USER_AGENT =
  "Mozilla/5.0 (compatible; SityBot/1.0; +https://sity.app/bot) Chrome/124.0 Safari/537.36";

const MAX_BODY_BYTES = 2_000_000;
const SCAN_TIMEOUT_MS = 20_000;

async function fetchPage(url: string): Promise<PageFetch> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    const headers: Record<string, string> = {};
    res.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    // Stream-guard the body: stop reading past the cap.
    const reader = res.body?.getReader();
    let body = "";
    if (reader) {
      const decoder = new TextDecoder("utf-8", { fatal: false });
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        body += decoder.decode(value, { stream: true });
        if (received > MAX_BODY_BYTES) {
          await reader.cancel().catch(() => {});
          break;
        }
      }
      body += decoder.decode();
    } else {
      body = await res.text();
    }
    return {
      finalUrl: res.url || url,
      status: res.status,
      headers,
      body,
      responseMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timer);
  }
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  seo: "SEO",
  security: "Security",
  bestPractices: "Best Practices",
};

export interface RawChecks {
  findings: Finding[];
  pageSizeKb: number;
  requestCount: number;
  responseMs: number;
  pageTitle?: string;
  metaDescription?: string;
}

/**
 * Run every check against a fetched page. Exported for testability;
 * called by the scanUrl action below.
 */
export function runChecks(page: PageFetch, requestedUrl: string): RawChecks {
  const { body: html, headers, status, finalUrl, responseMs } = page;
  const findings: Finding[] = [];
  const add = (f: Finding) => findings.push(f);

  const isHttps = finalUrl.startsWith("https://");
  const metas = getMetaContents(html);
  const title = getTitle(html);
  const h1Count = getH1Count(html);
  const h1 = getFirstH1(html);
  const resources = countExternalResources(html);
  const blocking = countRenderBlockingScripts(html);
  const noAlt = findImagesWithoutAlt(html);
  const insecure = findInsecureResources(html);
  const labels = findControlsWithoutLabels(html);
  const headingSkips = findHeadingSkips(html);
  const deprecated = countDeprecatedTags(html);
  const favicon = findFavicon(html);
  const images = (html.match(/<img\b/gi) ?? []).length;
  const lazyImages = countLazyImages(html);
  const htmlKb = Math.round((htmlByteLength(html) / 1024) * 10) / 10;
  const totalRequests = resources.scripts + resources.stylesheets + images + 1;

  // ------------------------------------------------------------------
  // Security
  // ------------------------------------------------------------------
  if (isHttps) {
    add({
      id: "sec-https",
      title: "HTTPS enabled",
      summary: "The site is served over a secure connection.",
      status: "pass",
      category: "security",
      impact: "Encrypts traffic between visitors and the server; required for modern features.",
      fix: "Nothing to do — keep the certificate renewed.",
    });
  } else {
    add({
      id: "sec-https",
      title: "No HTTPS",
      summary: "This page is served over plain http://.",
      status: "fail",
      category: "security",
      impact: "Traffic can be read or modified in transit; browsers label the site “Not secure”.",
      fix: "Get a TLS certificate (Let's Encrypt is free) and redirect all http:// traffic to https://.",
    });
  }

  if (isHttps && insecure.length > 0) {
    add({
      id: "sec-mixed",
      title: "Mixed content",
      summary: `${insecure.length} resource${insecure.length === 1 ? "" : "s"} loaded over http:// on an https page.`,
      status: "fail",
      category: "security",
      impact: "Browsers may block these resources, and the page is treated as partially insecure.",
      fix: "Load every script, stylesheet, and image over https://.",
      details: insecure.slice(0, 5).join("\n"),
    });
  } else if (isHttps) {
    add({
      id: "sec-mixed",
      title: "No mixed content",
      summary: "All detected resources are loaded over https://.",
      status: "pass",
      category: "security",
      impact: "Keeps the page fully secure and prevents browser warnings.",
      fix: "Nothing to do.",
    });
  }

  const securityHeaders: Array<{ name: string; why: string; fix: string }> = [
    { name: "strict-transport-security", why: "Forces browsers to always use https://.", fix: "Add: Strict-Transport-Security: max-age=31536000; includeSubDomains" },
    { name: "content-security-policy", why: "Mitigates cross-site scripting by whitelisting resource origins.", fix: "Start with a report-only CSP and tighten it over time." },
    { name: "x-content-type-options", why: "Stops browsers from MIME-sniffing responses.", fix: "Add: X-Content-Type-Options: nosniff" },
    { name: "x-frame-options", why: "Protects against clickjacking via framing.", fix: "Add: X-Frame-Options: DENY (or a frame-ancestors CSP directive)." },
    { name: "referrer-policy", why: "Controls how much referrer data leaks to other sites.", fix: "Add: Referrer-Policy: strict-origin-when-cross-origin" },
  ];
  const missingHeaders = securityHeaders.filter((h) => !headers[h.name]);
  if (missingHeaders.length === 0) {
    add({
      id: "sec-headers",
      title: "Security headers set",
      summary: "All five common security headers are present.",
      status: "pass",
      category: "security",
      impact: "Hardens the site against common web attacks.",
      fix: "Nothing to do.",
    });
  } else {
    add({
      id: "sec-headers",
      title: `Missing security headers (${missingHeaders.length})`,
      summary: missingHeaders.map((h) => h.name).join(", "),
      status: missingHeaders.length >= 3 ? "fail" : "warn",
      category: "security",
      impact: missingHeaders.map((h) => h.why).join(" "),
      fix: missingHeaders.map((h) => h.fix).join(" · "),
      details: `Received headers include: ${Object.keys(headers).slice(0, 12).join(", ")}`,
    });
  }

  const hasInlineHandlers = /on(click|load|error|mouseover)=/i.test(html);
  add({
    id: "sec-inline-handlers",
    title: hasInlineHandlers ? "Inline event handlers found" : "No inline event handlers",
    summary: hasInlineHandlers
      ? "The HTML uses inline on* attributes, which a strict CSP would block."
      : "Markup avoids inline on* attributes — CSP-friendly.",
    status: hasInlineHandlers ? "warn" : "pass",
    category: "security",
    impact: "Inline handlers usually indicate code that is harder to secure with a Content Security Policy.",
    fix: "Move event handling into external, deferred scripts and adopt a CSP.",
  });

  // ------------------------------------------------------------------
  // SEO
  // ------------------------------------------------------------------
  if (title && title.length >= 15 && title.length <= 65) {
    add({
      id: "seo-title",
      title: "Page title looks good",
      summary: `“${title}” (${title.length} chars)`,
      status: "pass",
      category: "seo",
      impact: "Titles are the primary search result headline.",
      fix: "Nothing to do.",
    });
  } else if (title) {
    add({
      id: "seo-title",
      title: title.length < 15 ? "Page title is very short" : "Page title is very long",
      summary: `“${title}” (${title.length} chars)`,
      status: "warn",
      category: "seo",
      impact: "Short titles waste search-result space; long ones get truncated.",
      fix: "Aim for a descriptive 15–65 character title unique to this page.",
    });
  } else {
    add({
      id: "seo-title",
      title: "No page title",
      summary: "The document has no <title> element.",
      status: "fail",
      category: "seo",
      impact: "Search engines and browser tabs have nothing to show.",
      fix: "Add a unique, descriptive <title> to the <head>.",
    });
  }

  const desc = metas["description"];
  if (desc && desc.length >= 50 && desc.length <= 160) {
    add({
      id: "seo-meta-desc",
      title: "Meta description present",
      summary: `${desc.length} characters`,
      status: "pass",
      category: "seo",
      impact: "Gives search engines the snippet text under your result.",
      fix: "Nothing to do.",
    });
  } else if (desc) {
    add({
      id: "seo-meta-desc",
      title: desc.length < 50 ? "Meta description is short" : "Meta description is long",
      summary: `${desc.length} characters`,
      status: "warn",
      category: "seo",
      impact: "Search engines may rewrite the snippet if it's too short or gets truncated.",
      fix: "Write a 50–160 character description summarizing the page.",
    });
  } else {
    add({
      id: "seo-meta-desc",
      title: "No meta description",
      summary: "Missing <meta name=\"description\">.",
      status: "warn",
      category: "seo",
      impact: "Search engines will generate their own snippet, often badly.",
      fix: "Add <meta name=\"description\" content=\"…\"> to the <head>.",
    });
  }

  const canonical = /<link[^>]+rel\s*=\s*["']?canonical/i.test(html);
  add({
    id: "seo-canonical",
    title: canonical ? "Canonical URL declared" : "No canonical URL",
    summary: canonical ? "<link rel=\"canonical\"> found." : "Search engines must guess the preferred URL.",
    status: canonical ? "pass" : "warn",
    category: "seo",
    impact: "Canonical tags consolidate duplicate URLs (params, trailing slashes) to one ranking page.",
    fix: canonical ? "Nothing to do." : "Add <link rel=\"canonical\" href=\"…\"> to the <head>.",
  });

  const robotsMeta = metas["robots"];
  if (robotsMeta && /noindex/i.test(robotsMeta)) {
    add({
      id: "seo-robots",
      title: "Page marked noindex",
      summary: `<meta name="robots" content="${robotsMeta}">`,
      status: "fail",
      category: "seo",
      impact: "Search engines are explicitly told to exclude this page from results.",
      fix: "Remove noindex if this page should be searchable.",
    });
  } else {
    add({
      id: "seo-robots",
      title: "Indexable",
      summary: "No noindex directive found.",
      status: "pass",
      category: "seo",
      impact: "Search engines are free to index the page.",
      fix: "Nothing to do.",
    });
  }

  if (h1Count === 1) {
    add({
      id: "seo-h1",
      title: "Single H1",
      summary: h1 ? `“${h1}”` : "One H1 found.",
      status: "pass",
      category: "seo",
      impact: "A single H1 clarifies the page's main topic for search engines.",
      fix: "Nothing to do.",
    });
  } else if (h1Count === 0) {
    add({
      id: "seo-h1",
      title: "No H1 heading",
      summary: "The page has no <h1> element.",
      status: "warn",
      category: "seo",
      impact: "Search engines lose the strongest topical signal for the page.",
      fix: "Add one <h1> that states the page's main topic.",
    });
  } else {
    add({
      id: "seo-h1",
      title: `Multiple H1s (${h1Count})`,
      summary: "More than one <h1> was found.",
      status: "warn",
      category: "seo",
      impact: "Dilutes the page's topical focus; screen readers may announce repeated headings.",
      fix: "Keep one H1; demote the others to h2/h3.",
    });
  }

  if (headingSkips.length > 0) {
    add({
      id: "a11y-heading-order",
      title: "Heading levels skip",
      summary: headingSkips.join(", "),
      status: "warn",
      category: "accessibility",
      impact: "Skipped levels break the outline screen-reader users navigate by.",
      fix: "Use headings in order (h1 → h2 → h3) without jumps.",
      details: `Heading counts: h1:${getH1Count(html)} h2:${(html.match(/<h2\b/gi) ?? []).length} h3:${(html.match(/<h3\b/gi) ?? []).length}`,
    });
  } else {
    add({
      id: "a11y-heading-order",
      title: "Heading structure is sequential",
      summary: "No skipped heading levels detected.",
      status: "pass",
      category: "accessibility",
      impact: "Screen-reader users get a clean, navigable outline.",
      fix: "Nothing to do.",
    });
  }

  // ------------------------------------------------------------------
  // Accessibility
  // ------------------------------------------------------------------
  if (images === 0) {
    add({
      id: "a11y-alt",
      title: "No images on this page",
      summary: "Alt-text check not applicable.",
      status: "pass",
      category: "accessibility",
      impact: "Nothing to check — the page has no <img> elements.",
      fix: "If you add images later, give every one a meaningful alt attribute.",
    });
  } else if (noAlt.length === 0) {
    add({
      id: "a11y-alt",
      title: "All images have alt text",
      summary: `${images} image${images === 1 ? "" : "s"} checked.`,
      status: "pass",
      category: "accessibility",
      impact: "Screen readers can describe images to non-sighted users.",
      fix: "Nothing to do.",
    });
  } else {
    add({
      id: "a11y-alt",
      title: `Missing alt text (${noAlt.length})`,
      summary: `${noAlt.length} of ${images} images have no alt attribute.`,
      status: noAlt.length > 3 ? "fail" : "warn",
      category: "accessibility",
      impact: "Screen-reader users can't tell what these images show.",
      fix: "Add alt=\"\" for decorative images and descriptive alt text for meaningful ones.",
      details: noAlt.slice(0, 5).join("\n"),
    });
  }

  const unlabeledTotal = labels.unlabeledInputs.length + labels.unlabeledTextareas + labels.unlabeledSelects;
  if (unlabeledTotal === 0) {
    add({
      id: "a11y-labels",
      title: "Form controls are labeled",
      summary: "Every input has an associated label, aria-label, or title.",
      status: "pass",
      category: "accessibility",
      impact: "Screen readers announce what each field is for.",
      fix: "Nothing to do.",
    });
  } else {
    add({
      id: "a11y-labels",
      title: `Unlabeled form controls (${unlabeledTotal})`,
      summary: `${labels.unlabeledInputs.length} input(s), ${labels.unlabeledTextareas} textarea(s), ${labels.unlabeledSelects} select(s) without labels.`,
      status: "fail",
      category: "accessibility",
      impact: "Users of assistive technology can't tell what to type into these fields.",
      fix: "Associate a <label for> with each control, or add aria-label.",
      details: labels.unlabeledInputs.slice(0, 5).join("\n"),
    });
  }

  if (!metas["viewport"]) {
    add({
      id: "bp-viewport",
      title: "No responsive viewport meta",
      summary: "Missing <meta name=\"viewport\">.",
      status: "fail",
      category: "bestPractices",
      impact: "Mobile browsers render at desktop width and zoom out, making text unreadably small.",
      fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.",
    });
  } else {
    add({
      id: "bp-viewport",
      title: "Responsive viewport set",
      summary: metas["viewport"],
      status: "pass",
      category: "bestPractices",
      impact: "The page scales correctly on phones and tablets.",
      fix: "Nothing to do.",
    });
  }

  if (deprecated.length > 0) {
    add({
      id: "bp-deprecated",
      title: "Deprecated HTML tags",
      summary: deprecated.map((d) => `<${d.tag}> ×${d.count}`).join(", "),
      status: "fail",
      category: "bestPractices",
      impact: "Removed from the HTML spec; rendering varies between browsers.",
      fix: "Replace with CSS (e.g. <center> → text-align: center).",
    });
  } else {
    add({
      id: "bp-deprecated",
      title: "No deprecated tags",
      summary: "No <center>, <font>, <marquee>, or similar legacy elements.",
      status: "pass",
      category: "bestPractices",
      impact: "Markup follows the current HTML standard.",
      fix: "Nothing to do.",
    });
  }

  if (favicon.present) {
    add({
      id: "bp-favicon",
      title: "Favicon defined",
      summary: appleIconText(favicon.appleIcon),
      status: "pass",
      category: "bestPractices",
      impact: "Shows a recognizable icon in tabs, bookmarks, and history.",
      fix: "Nothing to do.",
    });
  } else {
    add({
      id: "bp-favicon",
      title: "No favicon",
      summary: "No <link rel=\"icon\"> found.",
      status: "warn",
      category: "bestPractices",
      impact: "Browsers fall back to a generic page icon and may 404 on /favicon.ico.",
      fix: "Add <link rel=\"icon\" href=\"/favicon.ico\"> to the <head>.",
    });
  }

  add({
    id: "bp-lang",
    title: /<html[^>]+\blang\s*=/i.test(html) ? "Language declared" : "Language not declared",
    summary: /<html[^>]+\blang\s*=/i.test(html)
      ? "The <html> element declares its language."
      : "The <html> element has no lang attribute.",
    status: /<html[^>]+\blang\s*=/i.test(html) ? "pass" : "warn",
    category: "bestPractices",
    impact: "Screen readers pick the right pronunciation; search engines detect the language.",
    fix: /<html[^>]+\blang\s*=/i.test(html) ? "Nothing to do." : "Add lang=\"en\" (or the page's language) to <html>.",
  });

  // ------------------------------------------------------------------
  // Performance
  // ------------------------------------------------------------------
  const pageSizeOk = htmlKb <= 150;
  add({
    id: "perf-size",
    title: `HTML size: ${htmlKb} KB`,
    summary: pageSizeOk ? "Compact HTML document." : "The HTML document itself is large.",
    status: pageSizeOk ? "pass" : htmlKb > 500 ? "fail" : "warn",
    category: "performance",
    impact: "Browsers must download and parse every byte before the page becomes interactive.",
    fix: pageSizeOk ? "Nothing to do." : "Minify HTML, trim inline scripts/styles, and paginate very long lists.",
    details: `Measured from the fetched document only — excludes subresources.`,
  });

  add({
    id: "perf-requests",
    title: `${totalRequests} detected requests`,
    summary: `${resources.scripts} scripts, ${resources.stylesheets} stylesheets, ${images} images.`,
    status: totalRequests <= 50 ? "pass" : totalRequests > 100 ? "fail" : "warn",
    category: "performance",
    impact: "Every request adds latency, especially on mobile networks.",
    fix: totalRequests <= 50 ? "Nothing to do." : "Bundle scripts/styles and use CSS sprites or icon fonts where practical.",
  });

  if (blocking > 0) {
    add({
      id: "perf-blocking",
      title: `Render-blocking scripts (${blocking})`,
      summary: "Scripts in <head> without defer or async.",
      status: blocking > 3 ? "fail" : "warn",
      category: "performance",
      impact: "These pause HTML parsing while they download and run, delaying first paint.",
      fix: "Add the defer attribute to head scripts, or move them to the end of <body>.",
    });
  } else {
    add({
      id: "perf-blocking",
      title: "No render-blocking scripts",
      summary: "All head scripts are deferred, async, or modules.",
      status: "pass",
      category: "performance",
      impact: "The browser can paint the page without waiting on scripts.",
      fix: "Nothing to do.",
    });
  }

  if (images > 0) {
    const lazyRatio = lazyImages / images;
    add({
      id: "perf-lazy",
      title: lazyRatio >= 0.5 ? "Images use lazy loading" : "Images not lazy-loaded",
      summary: `${lazyImages} of ${images} images have loading="lazy".`,
      status: lazyRatio >= 0.5 ? "pass" : "warn",
      category: "performance",
      impact: "Lazy loading defers offscreen images, speeding up initial render.",
      fix: lazyRatio >= 0.5 ? "Nothing to do." : "Add loading=\"lazy\" to below-the-fold <img> tags.",
    });
  }

  // Response time is measured from the Convex runtime, not a browser — label it honestly.
  add({
    id: "perf-ttfb",
    title: `Server response: ${responseMs} ms`,
    summary: responseMs < 600 ? "Fast server response." : responseMs < 1200 ? "Acceptable server response." : "Slow server response.",
    status: responseMs < 600 ? "pass" : responseMs < 1200 ? "warn" : "fail",
    category: "performance",
    impact: "Every request waits on the server before anything can render.",
    fix: responseMs < 600 ? "Nothing to do." : "Add caching (CDN or Cache-Control headers) and optimize slow backend calls.",
    details: "Measured from Sity's cloud runtime to the target server — not a browser on your network.",
  });

  void status;
  void requestedUrl;

  return {
    findings,
    pageSizeKb: htmlKb,
    requestCount: totalRequests,
    responseMs,
    pageTitle: title,
    metaDescription: desc,
  };
}

function appleIconText(appleIcon: boolean): string {
  return appleIcon ? "Includes an apple-touch-icon." : "Consider adding an apple-touch-icon too.";
}

/** Score a category from its findings: pass=1, warn=0.5, fail=0. */
export function scoreFindings(findings: Finding[], category: CategoryKey): number {
  const list = findings.filter((f) => f.category === category);
  if (list.length === 0) return 100;
  const weight = list.reduce((sum, f) => sum + (f.status === "pass" ? 1 : f.status === "warn" ? 0.5 : 0), 0);
  return Math.round((weight / list.length) * 100);
}

export function tally(list: Finding[]): { passed: number; warnings: number; failed: number } {
  return {
    passed: list.filter((f) => f.status === "pass").length,
    warnings: list.filter((f) => f.status === "warn").length,
    failed: list.filter((f) => f.status === "fail").length,
  };
}

/** Build the AuditReport from raw checks — shared by real scans. */
export function buildReport(
  requestedUrl: string,
  page: PageFetch,
  checks: RawChecks,
): AuditReport {
  const findings = checks.findings;
  const performance = scoreFindings(findings, "performance");
  const accessibility = scoreFindings(findings, "accessibility");
  const seo = scoreFindings(findings, "seo");
  const security = scoreFindings(findings, "security");
  const bestPractices = scoreFindings(findings, "bestPractices");
  const overall = Math.round(
    performance * 0.25 + accessibility * 0.2 + seo * 0.2 + security * 0.2 + bestPractices * 0.15,
  );
  return {
    url: requestedUrl,
    finalUrl: page.finalUrl,
    scannedAt: Date.now(),
    mode: "real",
    scores: { overall, performance, accessibility, seo, security, bestPractices },
    metrics: {
      pageSizeKb: checks.pageSizeKb,
      requestCount: checks.requestCount,
      responseMs: checks.responseMs,
      pageTitle: checks.pageTitle,
      metaDescription: checks.metaDescription,
    },
    findings,
  };
}

export const scanUrl = action({
  args: { url: v.string() },
  handler: async (_ctx, { url }): Promise<AuditReport> => {
    const page = await fetchPage(url);
    if (page.status >= 400) {
      throw new Error(`HTTP ${page.status}`);
    }
    const checks = runChecks(page, url);
    return buildReport(url, page, checks);
  },
  returns: v.any(),
});
