"use client";
import { Button } from "@/components/ui/button";
export default function AppError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="py-12 max-w-lg">
      <h1 className="font-display text-2xl font-semibold">
        We couldn’t load this screen.
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Your workspace may be temporarily unavailable. Try again before making
        further changes.
      </p>
      <Button onClick={reset} className="mt-6">
        Try again
      </Button>
    </div>
  );
}
