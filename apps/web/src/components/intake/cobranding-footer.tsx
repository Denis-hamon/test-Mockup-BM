import { Lock } from "lucide-react";

// ---------------------------------------------------------------------------
// CobrandingFooter — "Propulse par LegalConnect" + encryption badge (D-11)
// ---------------------------------------------------------------------------

export function CobrandingFooter() {
  return (
    <footer className="flex items-center justify-between border-t pt-6 text-sm text-muted-foreground">
      <span>
        Propulse par{" "}
        <span className="font-semibold">LegalConnect</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Lock className="size-3.5" />
        Chiffre bout en bout
      </span>
    </footer>
  );
}
