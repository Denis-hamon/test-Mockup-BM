"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardCopy, Check } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// HostedLinkCopy — copyable hosted page URL
// ---------------------------------------------------------------------------

interface HostedLinkCopyProps {
  slug: string;
}

export function HostedLinkCopy({ slug }: HostedLinkCopyProps) {
  const [copied, setCopied] = useState(false);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const url = `${appUrl}/cabinet-${slug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copie dans le presse-papier.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={url} className="font-mono text-sm" />
      <Button variant="outline" onClick={handleCopy}>
        {copied ? (
          <>
            <Check className="size-4" data-icon="inline-start" />
            Copie !
          </>
        ) : (
          <>
            <ClipboardCopy className="size-4" data-icon="inline-start" />
            Copier le lien
          </>
        )}
      </Button>
    </div>
  );
}
