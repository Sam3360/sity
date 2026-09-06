export type ScanMode = "real" | "demo";

export type FindingStatus = "pass" | "warn" | "fail";

export interface Finding {
  /** Stable id used for React keys and localStorage persistence */
  id: string;
  /** Short headline, e.g. "Missing alt text" */
  title: string;
  /** One-line summary shown in the list row */
  summary: string;
  status: FindingStatus;
  category: CategoryKey;
  /** Why this finding matters */
  impact: string;
  /** How to fix it */
  fix: string;
  /** Optional technical details (selector, header names, etc.) */
  details?: string;
}

export type CategoryKey =
  | "performance"
  | "accessibility"
  | "seo"
  | "security"
  | "bestPractices";

export interface CategoryResult {
  key: CategoryKey;
  label: string;
  score: number; // 0-100
  passed: number;
  warnings: number;
  failed: number;
}

export interface AuditReport {
  url: string;
  finalUrl: string;
  scannedAt: number; // epoch ms
  mode: ScanMode;
  /** Present when mode === "demo" — human label like "Demo profile: excellent site" */
  demoProfileName?: string;
  scores: {
    overall: number;
    performance: number;
    accessibility: number;
    seo: number;
    security: number;
    bestPractices: number;
  };
  metrics: {
    pageSizeKb: number;
    requestCount: number;
    responseMs: number;
    pageTitle?: string;
    metaDescription?: string;
  };
  findings: Finding[];
}

export type AuditErrorCode =
  | "INVALID_URL"
  | "UNSUPPORTED_PROTOCOL"
  | "TIMEOUT"
  | "DNS_FAILURE"
  | "SERVER_ERROR"
  | "BLOCKED"
  | "NETWORK_ERROR"
  | "EMPTY_INPUT"
  | "UNKNOWN";

export interface AuditError {
  code: AuditErrorCode;
  title: string;
  message: string;
  hint?: string;
}

export interface ScanHistoryEntry {
  id: string;
  url: string;
  scannedAt: number;
  overall: number;
  mode: ScanMode;
  report: AuditReport;
}
