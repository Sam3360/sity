export function Footer() {
  return (
    <footer className="border-t border-border print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid size-5 place-items-center border border-border bg-card text-[10px] font-bold text-primary">
            s
          </span>
          <span className="font-mono">sity — a quick health check for your site.</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono">
          <a href="/" className="hover:text-foreground">home</a>
          <a href="/dashboard" className="hover:text-foreground">workspace</a>
          <a href="/report?demo=average" className="hover:text-foreground">demo</a>
          <a href="https://developer.mozilla.org/en-US/docs/Web/Performance" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            docs↗
          </a>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <p className="text-[11px] leading-relaxed text-muted-foreground/80">
          sity fetches the public HTML of a URL and inspects it server-side. It never executes
          target-site JavaScript, so runtime-only issues can't be seen. demo reports are simulated
          profiles — clearly labeled as demo, never attributed to a real site.
        </p>
      </div>
    </footer>
  );
}
