"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { BrandingConfig } from "@legalconnect/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";
import { ColorPicker } from "./color-picker";
import { LogoUpload } from "./logo-upload";

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
  const [localWelcome, setLocalWelcome] = useState(
    branding.welcomeText ?? ""
  );
  const [localSlug, setLocalSlug] = useState(branding.slug ?? "");
  const [slugStatus, setSlugStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const welcomeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const slugTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (welcomeTimer.current) clearTimeout(welcomeTimer.current);
      if (slugTimer.current) clearTimeout(slugTimer.current);
    };
  }, []);

  // Debounced welcome text
  const handleWelcomeChange = useCallback(
    (value: string) => {
      setLocalWelcome(value);
      if (welcomeTimer.current) clearTimeout(welcomeTimer.current);
      welcomeTimer.current = setTimeout(() => {
        onChange({ ...branding, welcomeText: value || undefined });
      }, 300);
    },
    [branding, onChange]
  );

  // Slug change with validation and availability check
  const handleSlugChange = useCallback(
    (value: string) => {
      // Enforce lowercase alphanumeric + hyphens only
      const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
      setLocalSlug(sanitized);
      setSlugStatus("idle");

      if (slugTimer.current) clearTimeout(slugTimer.current);
      slugTimer.current = setTimeout(() => {
        onChange({ ...branding, slug: sanitized || undefined });
      }, 300);
    },
    [branding, onChange]
  );

  // Check slug availability on blur
  const handleSlugBlur = useCallback(async () => {
    if (!localSlug || localSlug.length < 3) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    try {
      const result = await onCheckSlug(localSlug);
      setSlugStatus(result.available ? "available" : "taken");
    } catch {
      setSlugStatus("idle");
    }
  }, [localSlug, onCheckSlug]);

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-2">
        <Label>Logo du cabinet</Label>
        <p className="text-xs text-muted-foreground">
          PNG, SVG ou JPG. 200x200px recommande.
        </p>
        <LogoUpload
          currentUrl={branding.logoUrl}
          onUpload={(url) =>
            onChange({ ...branding, logoUrl: url || undefined })
          }
        />
      </div>

      {/* Accent color */}
      <div className="space-y-2">
        <Label>Couleur d&apos;accent</Label>
        <ColorPicker
          value={branding.accentColor ?? "#1a1a1a"}
          onChange={(hex) => onChange({ ...branding, accentColor: hex })}
        />
      </div>

      {/* Welcome text */}
      <div className="space-y-2">
        <Label>Texte d&apos;accueil</Label>
        <Textarea
          value={localWelcome}
          onChange={(e) => handleWelcomeChange(e.target.value)}
          placeholder="Bienvenue ! Decrivez votre situation juridique en toute confidentialite. Vos informations sont protegees par le secret professionnel."
          rows={3}
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label>Adresse du formulaire</Label>
        <Input
          value={localSlug}
          onChange={(e) => handleSlugChange(e.target.value)}
          onBlur={handleSlugBlur}
          placeholder="mon-cabinet"
          className="font-mono"
        />
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            app.legalconnect.fr/intake/{localSlug || "mon-cabinet"}
          </p>
          {slugStatus === "checking" && (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          )}
          {slugStatus === "available" && (
            <Check className="size-3 text-green-600" />
          )}
        </div>
        {slugStatus === "taken" && (
          <p className="text-xs text-destructive">
            Cette adresse est deja utilisee
          </p>
        )}
      </div>
    </div>
  );
}
