"use client";

import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FileDropzone } from "@/components/upload/file-dropzone";
import { FilePreview } from "@/components/upload/file-preview";
import { useFileEncryption } from "@/hooks/use-file-encryption";
import type { IntakeFormData } from "@legalconnect/shared";

interface StepDocumentsProps {
  form: UseFormReturn<IntakeFormData>;
}

export function StepDocuments({ form }: StepDocumentsProps) {
  const { files, encryptAndUpload, removeFile } = useFileEncryption();

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

  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files],
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
            <FilePreview key={file.id} file={file} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
