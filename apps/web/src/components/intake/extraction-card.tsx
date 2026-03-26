"use client";

/**
 * ExtractionCard — Editable card showing AI-extracted document data.
 *
 * States per UI-SPEC I-03:
 * - pending: Skeleton loader
 * - processing: Skeleton with "En cours d'analyse..." badge
 * - done: Card with extracted fields (inline-editable)
 * - failed: Alert with manual entry option
 */

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, AlertCircle } from "lucide-react";

export interface ExtractionCardProps {
  documentId: string;
  fileName: string;
  status: "pending" | "processing" | "done" | "failed";
  result?: {
    dates: string[];
    parties: string[];
    amounts: Array<{ value: string; currency: string }>;
    keyClauses: string[];
    documentType: string;
    summary: string;
  };
  onFieldEdit: (documentId: string, field: string, value: unknown) => void;
}

interface EditableFieldProps {
  label: string;
  value: string;
  editing: boolean;
  onSave: (value: string) => void;
}

function EditableField({ label, value, editing, onSave }: EditableFieldProps) {
  const [editValue, setEditValue] = useState(value);

  const handleBlur = useCallback(() => {
    if (editValue !== value) {
      onSave(editValue);
    }
  }, [editValue, value, onSave]);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {editing ? (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleBlur();
            if (e.key === "Escape") setEditValue(value);
          }}
          className="h-8 text-sm"
          aria-label={`Modifier ${label}`}
          autoFocus
        />
      ) : (
        <span className="text-sm">
          {value || <span className="italic text-muted-foreground">-</span>}
        </span>
      )}
    </div>
  );
}

function ExtractionSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function ExtractionCard({
  documentId,
  fileName,
  status,
  result,
  onFieldEdit,
}: ExtractionCardProps) {
  const [editing, setEditing] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade-in animation: set visible after mount when status is done
  useState(() => {
    if (status === "done") {
      const timer = setTimeout(() => setVisible(true), 10);
      return () => clearTimeout(timer);
    }
  });

  // Pending state: skeleton loader
  if (status === "pending") {
    return <ExtractionSkeleton />;
  }

  // Processing state: skeleton with badge
  if (status === "processing") {
    return (
      <div className="flex flex-col gap-2 p-4">
        <Badge variant="outline" className="w-fit">
          En cours d&apos;analyse...
        </Badge>
        <div className="animate-pulse">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // Failed state: destructive alert
  if (status === "failed") {
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertCircle className="size-4" />
        <AlertTitle>Analyse non disponible</AlertTitle>
        <AlertDescription>
          L&apos;analyse automatique n&apos;a pas pu etre effectuee. Vous pouvez
          completer les informations manuellement ci-dessous.
        </AlertDescription>
      </Alert>
    );
  }

  // Done state: card with extracted fields
  if (!result) return null;

  const handleFieldSave = (field: string, value: string) => {
    onFieldEdit(documentId, field, value);
  };

  const formatAmounts = (
    amounts: Array<{ value: string; currency: string }>
  ) => {
    return amounts.map((a) => `${a.value} ${a.currency}`).join(", ");
  };

  return (
    <Card
      className={`mt-2 p-4 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      role="region"
      aria-label={`Informations extraites de ${fileName}`}
    >
      {/* Header: document type + edit toggle */}
      <div className="flex items-center justify-between">
        {result.documentType && (
          <Badge variant="secondary">{result.documentType}</Badge>
        )}
        <button
          onClick={() => setEditing(!editing)}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="Modifier les informations extraites"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <Separator className="my-3" />

      {/* Field rows */}
      <div className="flex flex-col gap-2">
        <EditableField
          label="DATES"
          value={result.dates.join(", ")}
          editing={editing}
          onSave={(v) =>
            handleFieldSave(
              "dates",
              v
            )
          }
        />

        <EditableField
          label="PARTIES"
          value={result.parties.join(", ")}
          editing={editing}
          onSave={(v) =>
            handleFieldSave(
              "parties",
              v
            )
          }
        />

        <EditableField
          label="MONTANTS"
          value={formatAmounts(result.amounts)}
          editing={editing}
          onSave={(v) =>
            handleFieldSave(
              "amounts",
              v
            )
          }
        />

        <EditableField
          label="CLAUSES CLES"
          value={result.keyClauses.join("; ")}
          editing={editing}
          onSave={(v) =>
            handleFieldSave(
              "keyClauses",
              v
            )
          }
        />
      </div>

      <Separator className="my-3" />

      {/* Summary */}
      {result.summary && (
        <p className="text-sm text-muted-foreground">{result.summary}</p>
      )}
    </Card>
  );
}
