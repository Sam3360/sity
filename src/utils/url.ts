import type { AuditError, AuditErrorCode } from "@/types/sity";

/**
 * Normalize user input into a scan target.
 * Accepts "example.com", "example.com/path", "https://example.com" etc.
 */
export function parseScanInput(raw: string): {
  url?: string;
  error?: { code: AuditErrorCode; message: string; hint?: string };
} {
  const input = raw.trim();
  if (!input) {
    return {
      error: { code: "EMPTY_INPUT", message: "Enter a URL to scan, e.g. example.com" },
    };
  }

  // Reject whitespace-containing input early — almost always a paste accident.
  if (/\s/.test(input)) {
    return {
      error: { code: "INVALID_URL", message: "URLs can't contain spaces. Did you paste something extra?" },
    };
  }

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(input) ? input : `https://${input}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return {
      error: { code: "INVALID_URL", message: `“${input}” doesn't look like a valid URL.` },
    };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      error: {
        code: "UNSUPPORTED_PROTOCOL",
        message: `Sity can only scan http and https sites — not ${parsed.protocol.replace(":", "")}.`,
      },
    };
  }

  const host = parsed.hostname;
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host.endsWith(".local");
  if (isLocal) {
    return {
      error: {
        code: "UNSUPPORTED_PROTOCOL",
        message: "Sity runs in the cloud, so it can't reach localhost or your machine.",
        hint: "Try a deployed site, or run the demo scan to see how reports look.",
      },
    };
  }

  // Require something host-like: at least one dot or a valid bracketed IPv6.
  if (!host.includes(".") && !host.startsWith("[")) {
    return {
      error: { code: "INVALID_URL", message: `“${host}” is missing a domain extension, like .com or .dev.` },
    };
  }

  return { url: parsed.toString() };
}

/** Map any thrown scan failure to a friendly, user-facing error. */
export function toAuditError(err: unknown): AuditError {
  const raw = err instanceof Error ? err.message : String(err);
  const msg = raw.toLowerCase();

  if (msg.includes("abort") || msg.includes("deadline") || msg.includes("timeout")) {
    return {
      code: "TIMEOUT",
      title: "The site took too long to respond",
      message: "We gave the server 20 seconds, but it never finished answering.",
      hint: "The site may be down or very slow. Try again in a moment.",
    };
  }
  if (msg.includes("getaddrinfo") || msg.includes("enotfound") || msg.includes("dns")) {
    return {
      code: "DNS_FAILURE",
      title: "We couldn't find that site",
      message: "The domain doesn't appear to exist — or it no longer exists.",
      hint: "Double-check the spelling. example.com works great for a test.",
    };
  }
  if (msg.includes("403") || msg.includes("forbidden") || msg.includes("blocked")) {
    return {
      code: "BLOCKED",
      title: "The site refused our request",
      message: "The server answered, but it blocked Sity's scanner.",
      hint: "Many sites block automated visitors. Try scanning a different URL.",
    };
  }
  if (msg.includes("404") || msg.includes("cannot find") || /\bnot found\b/.test(msg)) {
    return {
      code: "SERVER_ERROR",
      title: "That page doesn't exist",
      message: "The server responded, but there's no page at this address.",
      hint: "Check the path — or scan the site root instead (e.g. example.com).",
    };
  }
  if (/\b5\d\d\b/.test(msg) || msg.includes("bad gateway") || msg.includes("server error")) {
    return {
      code: "SERVER_ERROR",
      title: "The site is having server trouble",
      message: "The server responded with a server-side error instead of the page.",
      hint: "This is the site's problem, not yours. Try again later.",
    };
  }
  if (msg.includes("certificate") || msg.includes("ssl") || msg.includes("tls")) {
    return {
      code: "NETWORK_ERROR",
      title: "Insecure or broken connection",
      message: "The site's HTTPS certificate couldn't be verified.",
      hint: "The site may have an expired or invalid certificate.",
    };
  }
  return {
    code: "NETWORK_ERROR",
    title: "Couldn't complete the scan",
    message: "Something went wrong while fetching the site.",
    hint: "Check the URL and try again. If it keeps failing, the site may block scanners.",
  };
}
