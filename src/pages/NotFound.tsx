import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-xs text-muted-foreground">$ sity scan /this-page</p>
      <h1 className="font-mono text-4xl font-bold status-fail">404</h1>
      <p className="text-sm text-muted-foreground">
        This route doesn't exist. The URL you're looking for isn't part of Sity.
      </p>
      <Button asChild className="mt-2 rounded-none font-mono text-sm">
        <a href="/">cd ~/home</a>
      </Button>
    </div>
  );
}
