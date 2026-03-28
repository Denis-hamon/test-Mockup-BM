"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ImageIcon, Video, Download } from "lucide-react";

interface DocumentItem {
  id: string;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  createdAt: Date | null;
}

interface DocumentGridProps {
  documents: DocumentItem[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return FileText;
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType.startsWith("video/")) return Video;
  return FileText;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function DocumentGrid({ documents }: DocumentGridProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-semibold">Aucun document</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Les documents que vous avez partag\u00e9s avec votre avocat appara\u00eetront
          ici.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => {
        const Icon = getFileIcon(doc.mimeType);

        return (
          <Card key={doc.id}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-semibold">
                  {doc.fileName ?? "Sans nom"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(doc.fileSize)}
                  {doc.createdAt && ` - ${formatDate(doc.createdAt)}`}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled
                aria-label={`T\u00e9l\u00e9charger ${doc.fileName ?? "document"}`}
                title="T\u00e9l\u00e9chargement bient\u00f4t disponible"
              >
                <Download className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
