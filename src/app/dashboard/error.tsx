"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="py-12 max-w-lg">
      <h1 className="font-display text-[26px] md:text-[28px] font-semibold">
        We couldn’t load this screen.
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Your workspace may be temporarily unavailable. Nothing you saved has
        been lost — try again, and if it keeps happening, let us know.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
      {error.digest ? (
        <p className="mt-6 text-xs text-muted-foreground">
          Reference: <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </div>
  );
}
