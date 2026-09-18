"use client";

import { useSyncExternalStore, useState } from "react";
import { Button } from "@/components/ui/button";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function TemplateActions({ text }: { text: string }) {
  const ready = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [status, setStatus] = useState("");
  const [fallback, setFallback] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setFallback(false);
      setStatus("Template copied. Paste it into your preferred document editor.");
    } catch {
      setFallback(true);
      setStatus("Copy is unavailable in this browser. Select the text below and copy it manually.");
    }
  }

  return (
    <div className="no-print mb-8 space-y-3">
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" disabled={!ready} onClick={copy}>Copy template</Button>
        <Button variant="outline" disabled={!ready} onClick={() => window.print()}>Print / save as PDF</Button>
      </div>
      <p className="text-sm text-muted-foreground">You can also select the form below to copy it, or use your browser’s Print menu and choose Save as PDF.</p>
      <p role="status" aria-live="polite" className="text-sm text-foreground">{status}</p>
      {fallback ? <div>
        <label htmlFor="template-copy" className="block text-sm font-medium">Template text for manual copying</label>
        <textarea id="template-copy" readOnly value={text} onFocus={(event) => event.currentTarget.select()} className="mt-2 min-h-64 w-full rounded-lg border border-border bg-card p-4 text-sm" />
      </div> : null}
    </div>
  );
}
