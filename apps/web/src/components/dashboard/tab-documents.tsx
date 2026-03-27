"use client";

import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface TabDocumentsProps {
  documents: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    createdAt: Date;
  }>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TabDocuments({ documents }: TabDocumentsProps) {
  if (documents.length === 0) {
    return (
      <Alert className="mt-4">
        <AlertTitle>Aucun document</AlertTitle>
        <AlertDescription>
          Aucun document n&apos;a ete joint a ce dossier.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {documents.map((doc) => (
        <Card key={doc.id} size="sm">
          <CardContent className="flex items-start gap-3">
            <div className="shrink-0 flex items-center justify-center size-10 rounded-md bg-muted">
              <FileText className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{doc.fileName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(doc.fileSize)}
                </span>
                <Badge variant="outline" className="text-[10px]">
                  {doc.mimeType.split("/").pop()?.toUpperCase()}
                </Badge>
              </div>
              {/* TODO: Wire download via presigned S3 URL when S3 integration is complete */}
              <Button variant="outline" size="xs" className="mt-2" disabled>
                Telecharger
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
