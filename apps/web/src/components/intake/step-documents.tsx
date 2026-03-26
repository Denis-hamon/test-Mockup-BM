"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { FilePreview } from "@/components/upload/file-preview";
import { useFileEncryption } from "@/hooks/use-file-encryption";
import { ExtractionCard } from "@/components/intake/extraction-card";
import {
  triggerExtraction,
  getExtractionResults,
  updateExtractionResult,
} from "@/server/actions/extraction.actions";
import type { IntakeFormData } from "@legalconnect/shared";

interface StepDocumentsProps {
  form: UseFormReturn<IntakeFormData>;
}

interface ExtractionStatus {
  id: string;
  status: "pending" | "processing" | "done" | "failed";
  result?: {
    dates: string[];
    parties: string[];
    amounts: Array<{ value: string; currency: string }>;
    keyClauses: string[];
    documentType: string;
    summary: string;
  };
}

export function StepDocuments({ form }: StepDocumentsProps) {
  const { files, encryptAndUpload, removeFile } = useFileEncryption();
  const [extractions, setExtractions] = useState<
    Record<string, ExtractionStatus>
  >({});
  const triggeredRef = useRef<Set<string>>(new Set());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync completed files to form state
  useEffect(() => {
    const completedFiles = files
      .filter((f) => f.status === "done")
      .map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        encryptedKey: f.encryptedKey,
        s3Key: f.s3Key,
        nonce: f.nonce,
      }));

    form.setValue("documents", completedFiles);
  }, [files, form]);

  // Trigger extraction when file upload completes
  useEffect(() => {
    for (const file of files) {
      if (file.status === "done" && !triggeredRef.current.has(file.id)) {
        triggeredRef.current.add(file.id);

        // Set initial pending state
        setExtractions((prev) => ({
          ...prev,
          [file.id]: { id: "", status: "pending" },
        }));

        // Trigger extraction in background
        triggerExtraction({
          documentId: file.id,
          s3Key: file.s3Key,
          mimeType: file.type,
          fileName: file.name,
          encryptedKey: file.encryptedKey,
          nonce: file.nonce,
        }).then((result) => {
          if (result.success && result.extractionId) {
            setExtractions((prev) => ({
              ...prev,
              [file.id]: { ...prev[file.id], id: result.extractionId! },
            }));
          }
        });
      }
    }
  }, [files]);

  // Poll for extraction results every 3s (I-05)
  useEffect(() => {
    const pendingDocIds = Object.entries(extractions)
      .filter(([, e]) => e.status === "pending" || e.status === "processing")
      .map(([docId]) => docId);

    if (pendingDocIds.length === 0) {
      // All done or failed — stop polling
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Start polling if not already running
    if (!pollingRef.current) {
      pollingRef.current = setInterval(async () => {
        const currentPending = Object.entries(extractions)
          .filter(
            ([, e]) => e.status === "pending" || e.status === "processing"
          )
          .map(([docId]) => docId);

        if (currentPending.length === 0) return;

        const results = await getExtractionResults(currentPending);

        setExtractions((prev) => {
          const updated = { ...prev };
          for (const r of results) {
            updated[r.documentId] = {
              id: r.id,
              status: r.status,
              result:
                r.status === "done"
                  ? {
                      dates: r.dates,
                      parties: r.parties,
                      amounts: r.amounts,
                      keyClauses: r.keyClauses,
                      documentType: r.documentType,
                      summary: r.summary,
                    }
                  : undefined,
            };
          }
          return updated;
        });
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [extractions]);

  const handleFieldEdit = useCallback(
    async (documentId: string, field: string, value: unknown) => {
      const extraction = extractions[documentId];
      if (!extraction?.id) return;

      // Parse the value back to appropriate type for the field
      const fields: Record<string, unknown> = {};

      if (field === "dates" || field === "parties" || field === "keyClauses") {
        fields[field] = String(value)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (field === "amounts") {
        // Parse "15000 EUR, 2000 USD" format
        fields[field] = String(value)
          .split(",")
          .map((s) => {
            const parts = s.trim().split(/\s+/);
            return {
              value: parts[0] || "",
              currency: parts[1] || "EUR",
            };
          })
          .filter((a) => a.value);
      } else {
        fields[field] = value;
      }

      await updateExtractionResult(
        extraction.id,
        fields as Parameters<typeof updateExtractionResult>[1]
      );

      // Update local state
      setExtractions((prev) => ({
        ...prev,
        [documentId]: {
          ...prev[documentId],
          result: prev[documentId]?.result
            ? { ...prev[documentId].result!, [field]: fields[field] }
            : undefined,
        },
      }));
    },
    [extractions]
  );

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files]
  );

  function handleFilesAccepted(acceptedFiles: File[]) {
    for (const file of acceptedFiles) {
      encryptAndUpload(file);
    }
  }

  function handleRemove(fileId: string) {
    removeFile(fileId);
  }

  return (
    <div className="flex flex-col gap-6">
      <FileDropzone
        onFilesAccepted={handleFilesAccepted}
        currentTotalSize={totalSize}
      />
      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {files.map((file) => (
            <div key={file.id}>
              <FilePreview file={file} onRemove={handleRemove} />
              {file.status === "done" && (
                <ExtractionCard
                  documentId={file.id}
                  fileName={file.name}
                  status={extractions[file.id]?.status ?? "pending"}
                  result={extractions[file.id]?.result}
                  onFieldEdit={handleFieldEdit}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
