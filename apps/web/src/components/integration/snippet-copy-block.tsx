"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardCopy, Check } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// SnippetCopyBlock — copyable widget script tag (D-07)
// ---------------------------------------------------------------------------

interface SnippetCopyBlockProps {
  slug: string;
  accentColor: string;
}

export function SnippetCopyBlock({ slug, accentColor }: SnippetCopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const snippet = `<script src="${appUrl}/api/widget?v=1" data-slug="${slug}" data-color="${accentColor}"></script>`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Code copie dans le presse-papier.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le code.");
    }
  }

  return (
    <div className="relative rounded-lg bg-muted p-4">
      <pre className="overflow-x-auto font-mono text-sm leading-relaxed whitespace-pre-wrap break-all">
        {snippet}
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-2 top-2"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="size-4" data-icon="inline-start" />
            Copie !
          </>
        ) : (
          <>
            <ClipboardCopy className="size-4" data-icon="inline-start" />
            Copier
          </>
        )}
      </Button>
    </div>
  );
}
