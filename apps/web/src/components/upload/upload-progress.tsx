"use client";

import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
  status: "encrypting" | "uploading";
}

export function UploadProgress({ progress, status }: UploadProgressProps) {
  const label = status === "encrypting" ? "Chiffrement..." : "Envoi...";

  return (
    <div className="flex flex-col gap-1">
      <Progress value={progress} className="h-2" />
      <span className="text-xs text-muted-foreground">{label} {progress}%</span>
    </div>
  );
}
