"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied", {
        description: "Paste it into an email or message to your colleague.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy automatically", {
        description: "Select the link and copy it manually.",
      });
    }
  };

  return (
    <div className="mt-2 flex items-center gap-2">
      <input
        readOnly
        value={url}
        aria-label="Invite link"
        onFocus={(e) => e.currentTarget.select()}
        className="field min-w-0 flex-1 font-mono text-xs"
      />
      <Button type="button" size="sm" variant="outline" onClick={copy}>
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
