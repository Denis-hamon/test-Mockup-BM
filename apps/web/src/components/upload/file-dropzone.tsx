"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrustTooltip } from "@/components/trust/trust-tooltip";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_TYPES,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
} from "@/hooks/use-file-encryption";

interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  currentTotalSize: number;
  disabled?: boolean;
  className?: string;
}

export function FileDropzone({
  onFilesAccepted,
  currentTotalSize,
  disabled,
  className,
}: FileDropzoneProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      const newErrors: string[] = [];

      // Check rejected files
      for (const rejection of rejected) {
        for (const err of rejection.errors) {
          if (err.code === "file-too-large") {
            newErrors.push(
              `${rejection.file.name} : fichier trop volumineux (max 50 Mo)`,
            );
          } else if (
            err.code === "file-invalid-type"
          ) {
            newErrors.push(
              `${rejection.file.name} : type de fichier non accepte`,
            );
          }
        }
      }

      // Check total size
      const newFilesSize = accepted.reduce((sum, f) => sum + f.size, 0);
      if (currentTotalSize + newFilesSize > MAX_TOTAL_SIZE) {
        newErrors.push("Taille totale depassee (max 200 Mo)");
        setErrors(newErrors);
        return;
      }

      setErrors(newErrors);

      if (accepted.length > 0) {
        onFilesAccepted(accepted);
      }
    },
    [onFilesAccepted, currentTotalSize],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    onDrop,
    disabled,
    noClick: true,
  });

  return (
    <div className="flex flex-col gap-2">
      <Card
        {...getRootProps()}
        role="button"
        tabIndex={0}
        aria-label="Zone de depot de fichiers"
        className={cn(
          "flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-4 border-2 border-dashed p-12 transition-colors",
          isDragActive && "border-primary bg-primary/5",
          !isDragActive && "border-muted-foreground/25",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input {...getInputProps()} />
        <Upload className="size-8 text-muted-foreground" data-icon />
        <div className="text-center">
          <p className="text-muted-foreground">
            Glissez vos fichiers ici ou cliquez pour parcourir
          </p>
          <p className="text-xs text-muted-foreground/70">
            PDF, images (JPG, PNG, HEIC), videos (MP4, MOV, WebM) — max 50 Mo par fichier
          </p>
        </div>
        <Button type="button" variant="outline" onClick={open}>
          Parcourir
        </Button>
        <TrustTooltip content="Vos fichiers sont chiffres de bout en bout avant l'envoi" />
      </Card>

      {errors.length > 0 && (
        <div className="flex flex-col gap-1">
          {errors.map((error, i) => (
            <p key={i} className="text-sm text-destructive">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
