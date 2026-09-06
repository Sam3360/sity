import type { FindingStatus } from "@/types/sity";

export function scoreTone(score: number): "pass" | "warn" | "fail" {
  if (score >= 90) return "pass";
  if (score >= 50) return "warn";
  return "fail";
}

export function statusGlyph(status: FindingStatus): string {
  switch (status) {
    case "pass":
      return "✓";
    case "warn":
      return "!";
    case "fail":
      return "✕";
  }
}

export function statusLabel(status: FindingStatus): string {
  switch (status) {
    case "pass":
      return "Pass";
    case "warn":
      return "Warn";
    case "fail":
      return "Fail";
  }
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(ts);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function prettyHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
