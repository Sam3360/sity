import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { History, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { HistoryPanel } from "./HistoryPanel";
import type { ScanHistoryEntry } from "@/types/sity";

interface HeaderProps {
  entries: ScanHistoryEntry[];
  onOpenEntry: (entry: ScanHistoryEntry) => void;
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

export function Header({ entries, onOpenEntry, onDeleteEntry, onClearHistory }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href="/"
          className="group flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          aria-label="Sity — home"
        >
          <span className="grid size-7 place-items-center border border-border bg-card font-mono text-sm font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            s
          </span>
          <span className="font-mono text-lg font-bold tracking-tight">
            sity<span className="blink-caret text-primary">_</span>
          </span>
        </a>

        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="rounded-md px-2 py-1 font-mono text-xs text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            workspace
          </a>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
                <History className="size-3.5" />
                <span className="hidden sm:inline">history</span>
                <span className="rounded-xs bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {entries.length}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full max-w-md flex-col gap-0 p-0">
              <SheetHeader className="border-b border-border">
                <SheetTitle className="font-mono text-sm tracking-wide">~/scan-history</SheetTitle>
                <SheetDescription className="text-xs">
                  Stored locally in your browser. No account needed.
                </SheetDescription>
              </SheetHeader>
              <HistoryPanel
                entries={entries}
                onOpenEntry={(e) => {
                  onOpenEntry(e);
                }}
                onDeleteEntry={onDeleteEntry}
                onClearHistory={onClearHistory}
              />
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            className="size-8"
          >
            {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </Button>
        </div>
      </div>
    </header>
  );
}
