import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseScanInput } from "@/utils/url";
import { DEMO_PROFILES } from "@/lib/demoProfiles";
import type { AuditError } from "@/types/sity";

interface ScanFormProps {
  onScan: (input: string, mode: "real" | "demo", demoKey?: string) => void;
  isScanning: boolean;
  /** Prefill value (e.g. from history or demo links) */
  initialUrl?: string;
  error?: AuditError | null;
}

export function ScanForm({ onScan, isScanning, initialUrl = "", error }: ScanFormProps) {
  const [value, setValue] = useState(initialUrl);
  const [touchedError, setTouchedError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedError(null);
    const parsed = parseScanInput(value);
    if (parsed.error) {
      setTouchedError(parsed.error.message);
      return;
    }
    onScan(parsed.url!, "real");
  };

  const displayError = touchedError ?? (error ? `${error.title} — ${error.message}` : null);

  return (
    <div className="w-full">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row" noValidate>
        <div className="relative flex-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground"
          >
            $
          </span>
          <label htmlFor="scan-url" className="sr-only">
            Website URL to audit
          </label>
          <Input
            id="scan-url"
            name="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            placeholder="example.com"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (touchedError) setTouchedError(null);
            }}
            disabled={isScanning}
            aria-invalid={Boolean(displayError)}
            aria-describedby={displayError ? "scan-url-error" : undefined}
            className={cn(
              "h-11 rounded-none pl-9 font-mono text-sm",
              displayError && "border-destructive",
            )}
          />
        </div>
        <Button
          type="submit"
          disabled={isScanning}
          className="h-11 rounded-none px-6 font-mono text-sm font-semibold"
        >
          {isScanning ? (
            <>
              <Loader2 className="size-4 animate-spin" /> scanning…
            </>
          ) : (
            "scan site"
          )}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isScanning}
              className="h-11 rounded-none gap-1.5 px-4 font-mono text-sm"
            >
              try demo scan <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 rounded-none border-border font-mono">
            <p className="px-2 py-1.5 text-[11px] text-muted-foreground">
              Simulated reports — clearly labeled as demo.
            </p>
            {DEMO_PROFILES.map((p) => (
              <DropdownMenuItem
                key={p.key}
                onClick={() => onScan("", "demo", p.key)}
                className="cursor-pointer flex-col items-start gap-0.5"
              >
                <span className="text-xs font-semibold">{p.label}</span>
                <span className="text-[11px] text-muted-foreground">{p.url.replace(/^https?:\/\//, "")} — {p.blurb}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </form>

      {displayError && (
        <p
          id="scan-url-error"
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-xs status-fail"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          <span>{displayError}</span>
        </p>
      )}
    </div>
  );
}
