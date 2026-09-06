// Pure audit helpers — no Convex imports so logic is testable and portable.
// Runs inside a Convex "use node" action (Node 18+ fetch).

export interface PageFetch {
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  body: string;
  responseMs: number;
}

/** All attribute values of every tag whose name matches, lowercased tag names. */
export function extractTagAttrs(html: string, tagName: string): string[] {
  const re = new RegExp(`<${tagName}(\\s[^>]*)?>`, "gi");
  return (html.match(re) ?? []).map((t) => t.toLowerCase());
}

export function countTag(html: string, tagName: string): number {
  return (html.match(new RegExp(`<${tagName}(\\s|>|/)`, "gi")) ?? []).length;
}

/** Extract the value of an attribute from a raw tag string, or undefined. */
export function getAttr(tag: string, attr: string): string | undefined {
  const re = new RegExp(`${attr}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const m = tag.match(re);
  if (!m) return undefined;
  return (m[2] ?? m[3] ?? m[4] ?? "").trim();
}

/** Get all <meta name="x" content="y"> / <meta property="x"> content values. */
export function getMetaContents(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tag of extractTagAttrs(html, "meta")) {
    const name = getAttr(tag, "name") ?? getAttr(tag, "property");
    const content = getAttr(tag, "content");
    if (name && content != null) out[name.toLowerCase()] = content;
  }
  return out;
}

/** Find the first <h1>…</h1> text content. */
export function getFirstH1(html: string): string | undefined {
  const m = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return undefined;
  return m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function getH1Count(html: string): number {
  return countTag(html, "h1");
}

export function getTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, " ").trim() : undefined;
}

/** Approximate rendered page size: HTML bytes + referenced same-origin-safe asset sizes are unknown, so HTML only. */
export function htmlByteLength(html: string): number {
  return Buffer.byteLength(html, "utf8");
}

/** Count external <script src> / <link rel=stylesheet href> tags. */
export function countExternalResources(html: string): {
  scripts: number;
  stylesheets: number;
  inlineScripts: number;
  inlineStyles: number;
} {
  const scriptTags = extractTagAttrs(html, "script");
  const linkTags = extractTagAttrs(html, "link");
  const scripts = scriptTags.filter((t) => /src\s*=/i.test(t)).length;
  const inlineScripts = scriptTags.length - scripts;
  const stylesheets = linkTags.filter(
    (t) => /rel\s*=\s*["']?stylesheet/i.test(t) && /href\s*=/i.test(t),
  ).length;
  const inlineStyles = (html.match(/<style\b/gi) ?? []).length;
  return { scripts, stylesheets, inlineScripts, inlineStyles };
}

/** Split resource URLs into http:// vs https:// for mixed-content checks. */
export function findInsecureResources(html: string): string[] {
  const urls: string[] = [];
  for (const tag of [...extractTagAttrs(html, "script"), ...extractTagAttrs(html, "img"), ...extractTagAttrs(html, "iframe")]) {
    const src = getAttr(tag, "src");
    if (src && src.startsWith("http://")) urls.push(src);
  }
  for (const tag of extractTagAttrs(html, "link")) {
    const href = getAttr(tag, "href");
    if (href && href.startsWith("http://")) urls.push(href);
  }
  return urls;
}

export function findImagesWithoutAlt(html: string): string[] {
  const missing: string[] = [];
  for (const tag of extractTagAttrs(html, "img")) {
    if (!/\balt\s*=/i.test(tag)) missing.push(getAttr(tag, "src") ?? "(unknown src)");
  }
  return missing;
}

/** <img> tags with loading="lazy" — a decent optimization signal. */
export function countLazyImages(html: string): number {
  return extractTagAttrs(html, "img").filter((t) => /loading\s*=\s*["']?lazy/i.test(t)).length;
}

export function findControlsWithoutLabels(html: string): {
  unlabeledInputs: string[];
  unlabeledTextareas: number;
  unlabeledSelects: number;
} {
  const unlabeledInputs: string[] = [];
  let unlabeledTextareas = 0;
  let unlabeledSelects = 0;

  const isLabeled = (tag: string): boolean => {
    if (/aria-label\s*=/i.test(tag)) return true;
    if (/aria-labelledby\s*=/i.test(tag)) return true;
    if (/title\s*=\s*["'][^"']+["']/i.test(tag)) return true;
    const id = getAttr(tag, "id");
    if (id && html.includes(`for="${id}"`) ) return true;
    // Wrapped in a <label> — approximate: check for a <label within 200 chars before
    const idx = html.toLowerCase().indexOf(tag);
    if (idx > 0) {
      const before = html.slice(Math.max(0, idx - 200), idx).toLowerCase();
      if (before.lastIndexOf("<label") > before.lastIndexOf("</label>")) return true;
    }
    return false;
  };

  for (const tag of extractTagAttrs(html, "input")) {
    const type = (getAttr(tag, "type") ?? "text").toLowerCase();
    if (["hidden", "submit", "button", "reset", "image"].includes(type)) continue;
    if (!isLabeled(tag)) unlabeledInputs.push(getAttr(tag, "name") ?? getAttr(tag, "id") ?? type);
  }
  for (const tag of extractTagAttrs(html, "textarea")) {
    if (!isLabeled(tag)) unlabeledTextareas++;
  }
  for (const tag of extractTagAttrs(html, "select")) {
    if (!isLabeled(tag)) unlabeledSelects++;
  }
  return { unlabeledInputs, unlabeledTextareas, unlabeledSelects };
}

export function getHeadingCounts(html: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    counts[level] = countTag(html, level);
  }
  return counts;
}

/** Detect heading-level skips, e.g. h1 -> h3. Returns list of descriptions. */
export function findHeadingSkips(html: string): string[] {
  const seq: number[] = [];
  const re = /<h([1-6])\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) seq.push(Number(m[1]));
  const skips: string[] = [];
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] - seq[i - 1] > 1) {
      skips.push(`h${seq[i - 1]} → h${seq[i]}`);
    }
  }
  return skips;
}

export function countDeprecatedTags(html: string): { tag: string; count: number }[] {
  const deprecated = ["center", "font", "marquee", "big", "strike", "tt", "frame", "frameset", "applet"];
  return deprecated
    .map((tag) => ({ tag, count: countTag(html, tag) }))
    .filter((t) => t.count > 0);
}

/** Find favicon links: rel contains "icon" (covers apple-touch-icon too). */
export function findFavicon(html: string): { present: boolean; appleIcon: boolean } {
  const linkTags = extractTagAttrs(html, "link");
  let present = false;
  let appleIcon = false;
  for (const tag of linkTags) {
    const rel = (getAttr(tag, "rel") ?? "").toLowerCase();
    if (rel.includes("icon")) {
      present = true;
      if (rel.includes("apple")) appleIcon = true;
    }
  }
  return { present, appleIcon };
}

/** Rough inline <script> byte total — render-blocking-ish signal alongside blocking scripts in <head>. */
export function inlineScriptBytes(html: string): number {
  let total = 0;
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    total += Buffer.byteLength(m[1], "utf8");
  }
  return total;
}

/** Scripts in <head> without defer/async are render-blocking. */
export function countRenderBlockingScripts(html: string): number {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  let blocking = 0;
  for (const tag of extractTagAttrs(head, "script")) {
    if (!/src\s*=/i.test(tag)) continue;
    if (/\b(defer|async)\b/i.test(tag)) continue;
    if (/\btype\s*=\s*["']module["']/i.test(tag)) continue; // modules are deferred by default
    blocking++;
  }
  return blocking;
}
