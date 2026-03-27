"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

const PRESETS = [
  { hex: "#1a1a1a", label: "Noir" },
  { hex: "#2563eb", label: "Bleu" },
  { hex: "#16a34a", label: "Vert" },
  { hex: "#7c3aed", label: "Violet" },
  { hex: "#ea580c", label: "Orange" },
  { hex: "#dc2626", label: "Rouge" },
];

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [localHex, setLocalHex] = useState(value || "#1a1a1a");

  const handleHexChange = useCallback(
    (hex: string) => {
      setLocalHex(hex);
      if (HEX_REGEX.test(hex)) {
        onChange(hex);
      }
    },
    [onChange]
  );

  return (
    <div className="space-y-3">
      {/* Preset swatches */}
      <div className="flex gap-2" role="radiogroup" aria-label="Couleurs predefinies">
        {PRESETS.map((preset) => (
          <button
            key={preset.hex}
            type="button"
            role="radio"
            aria-checked={value === preset.hex}
            aria-label={preset.label}
            onClick={() => {
              setLocalHex(preset.hex);
              onChange(preset.hex);
            }}
            className={cn(
              "size-8 rounded-full transition-all",
              value === preset.hex && "ring-2 ring-offset-2 ring-primary"
            )}
            style={{ backgroundColor: preset.hex }}
          />
        ))}
      </div>

      {/* Native color picker + hex input */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#1a1a1a"}
          onChange={(e) => {
            setLocalHex(e.target.value);
            onChange(e.target.value);
          }}
          className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
          aria-label="Selecteur de couleur"
        />
        <Input
          value={localHex}
          onChange={(e) => handleHexChange(e.target.value)}
          placeholder="#000000"
          className="w-28 font-mono text-sm"
          maxLength={7}
        />
      </div>
    </div>
  );
}
