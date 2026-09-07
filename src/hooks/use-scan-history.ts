import { useCallback, useState } from "react";
import type { AuditReport, ScanHistoryEntry } from "@/types/sity";

const STORAGE_KEY = "sity.scan-history.v1";
const MAX_ENTRIES = 30;

function isEntry(value: unknown): value is ScanHistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const e = value as Partial<ScanHistoryEntry>;
  return (
    typeof e.id === "string" &&
    typeof e.url === "string" &&
    typeof e.scannedAt === "number" &&
    typeof e.overall === "number" &&
    (e.mode === "real" || e.mode === "demo") &&
    typeof e.report === "object" &&
    e.report !== null
  );
}

function loadEntries(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry);
  } catch {
    return [];
  }
}

function persist(entries: ScanHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Storage may be full or unavailable (private mode) — history is best-effort.
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useScanHistory() {
  const [entries, setEntries] = useState<ScanHistoryEntry[]>(() => loadEntries());

  const addReport = useCallback((report: AuditReport) => {
    setEntries((prev) => {
      const entry: ScanHistoryEntry = {
        id: makeId(),
        url: report.finalUrl || report.url,
        scannedAt: report.scannedAt,
        overall: report.scores.overall,
        mode: report.mode,
        report,
      };
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      persist(next);
      return next;
    });
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.id !== id);
      persist(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { entries, addReport, removeEntry, clearHistory };
}
