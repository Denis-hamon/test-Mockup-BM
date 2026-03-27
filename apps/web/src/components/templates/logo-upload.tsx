"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
}

const ACCEPTED_TYPES = ["image/png", "image/svg+xml", "image/jpeg"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function LogoUpload({ currentUrl, onUpload }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(currentUrl);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Format non supporte. Utilisez PNG, SVG ou JPG.");
        return;
      }

      if (file.size > MAX_SIZE) {
        setError("Fichier trop volumineux (max 2 Mo).");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        onUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setPreview(undefined);
    onUpload("");
    if (inputRef.current) inputRef.current.value = "";
  }, [onUpload]);

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Logo du cabinet"
            className="max-h-[200px] max-w-[200px] rounded-md border object-contain"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute -top-2 -right-2 rounded-full bg-background border shadow-sm"
            onClick={handleRemove}
            aria-label="Supprimer le logo"
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        <div
          aria-label="Telecharger le logo du cabinet"
          role="button"
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          )}
        >
          <Upload className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Glissez votre logo ici ou cliquez pour parcourir
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".png,.svg,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
