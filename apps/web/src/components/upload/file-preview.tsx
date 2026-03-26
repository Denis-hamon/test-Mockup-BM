"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Video, ImageIcon, Trash2 } from "lucide-react";
import { EncryptionBadge } from "@/components/trust/encryption-badge";
import { UploadProgress } from "@/components/upload/upload-progress";
import { cn } from "@/lib/utils";
import type { UploadedFile } from "@/hooks/use-file-encryption";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function isVideoType(type: string): boolean {
  return (
    type === "video/mp4" ||
    type === "video/quicktime" ||
    type === "video/webm"
  );
}

function isPdfType(type: string): boolean {
  return type === "application/pdf";
}

function isHeicType(type: string): boolean {
  return type === "image/heic";
}

function FileIcon({ file }: { file: UploadedFile }) {
  if (file.thumbnailUrl && !isHeicType(file.type)) {
    return (
      <img
        src={file.thumbnailUrl}
        alt={file.name}
        className="size-10 rounded object-cover"
      />
    );
  }

  if (isPdfType(file.type)) {
    return <FileText data-icon className="size-10 text-red-500" />;
  }

  if (isVideoType(file.type)) {
    return <Video data-icon className="size-10 text-blue-500" />;
  }

  // HEIC or other image types without thumbnail
  return <ImageIcon data-icon className="size-10 text-muted-foreground" />;
}

interface FilePreviewProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex-shrink-0">
          <FileIcon file={file} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </span>

          {(file.status === "encrypting" || file.status === "uploading") && (
            <UploadProgress progress={file.progress} status={file.status} />
          )}

          {file.status === "done" && <EncryptionBadge />}

          {file.status === "error" && (
            <span className="text-xs text-destructive">
              Erreur lors de l&apos;envoi
            </span>
          )}
        </div>

        <div className="flex-shrink-0">
          {confirmingDelete ? (
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onRemove(file.id);
                  setConfirmingDelete(false);
                }}
              >
                Oui
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingDelete(false)}
              >
                Non
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setConfirmingDelete(true)}
              aria-label="Supprimer le fichier"
            >
              <Trash2 data-icon className="size-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
