"use client";

import type { BrandingConfig } from "@legalconnect/shared";

// Placeholder — full implementation in Task 2
interface BrandingEditorProps {
  branding: BrandingConfig;
  onChange: (branding: BrandingConfig) => void;
  onCheckSlug: (slug: string) => Promise<{ available: boolean }>;
}

export function BrandingEditor({
  branding,
  onChange,
  onCheckSlug,
}: BrandingEditorProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configuration d&apos;apparence (implementation en cours)
      </p>
    </div>
  );
}
