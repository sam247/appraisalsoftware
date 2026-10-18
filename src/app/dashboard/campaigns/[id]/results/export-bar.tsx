"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { useEffect } from "react";

/**
 * PDF export uses the browser's print engine with a dedicated print stylesheet
 * (cover, page breaks per person, no app chrome) — choose "Save as PDF".
 */
export default function ExportBar({ campaignId, fileTitle }: { campaignId: string; fileTitle: string }) {
  useEffect(() => {
    // Collapsed sections must be expanded in the PDF, then restored.
    let opened: HTMLDetailsElement[] = [];
    const before = () => {
      opened = [...document.querySelectorAll<HTMLDetailsElement>(".report-content details:not([open])")];
      opened.forEach((d) => (d.open = true));
    };
    const after = () => opened.forEach((d) => (d.open = false));
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);

  const print = () => {
    const original = document.title;
    document.title = fileTitle; // becomes the suggested PDF file name
    window.print();
    document.title = original;
  };

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={print}>
        <Download aria-hidden />
        Download PDF
      </Button>
      <Button asChild variant="outline">
        <a href={`/dashboard/campaigns/${campaignId}/results/export`} download>
          <FileSpreadsheet aria-hidden />
          Export CSV
        </a>
      </Button>
    </div>
  );
}
