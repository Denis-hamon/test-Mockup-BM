"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { updateCaseStatus } from "@/server/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const STATUS_CONFIG: Record<string, { label: string; order: number }> = {
  submitted: { label: "Nouveau", order: 0 },
  en_cours: { label: "En cours", order: 1 },
  termine: { label: "Termin\u00e9", order: 2 },
  archive: { label: "Archiv\u00e9", order: 3 },
};

interface StatusDropdownProps {
  submissionId: string;
  currentStatus: string;
  clientName?: string;
}

export function StatusDropdown({
  submissionId,
  currentStatus,
  clientName,
}: StatusDropdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [archiveOpen, setArchiveOpen] = useState(false);

  const currentOrder = STATUS_CONFIG[currentStatus]?.order ?? -1;
  const currentLabel = STATUS_CONFIG[currentStatus]?.label ?? currentStatus;

  // Forward transitions only (higher order), except from archive (terminal)
  const availableTransitions = Object.entries(STATUS_CONFIG).filter(
    ([key, config]) =>
      config.order > currentOrder && currentStatus !== "archive"
  );

  function handleStatusChange(newStatus: string) {
    if (newStatus === "archive") {
      setArchiveOpen(true);
      return;
    }
    performUpdate(newStatus);
  }

  function performUpdate(newStatus: string) {
    startTransition(async () => {
      const result = await updateCaseStatus(submissionId, newStatus);
      if (result.success) {
        toast.success("Statut mis \u00e0 jour");
        router.refresh();
      } else {
        toast.error("Erreur lors de la mise \u00e0 jour");
      }
    });
  }

  if (availableTransitions.length === 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-sm font-medium text-muted-foreground">
        {currentLabel}
      </span>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="sm" disabled={isPending}>
              {currentLabel}
              <ChevronDown data-icon="inline-end" className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          {availableTransitions.map(([key, config]) => (
            <DropdownMenuItem
              key={key}
              onSelect={() => handleStatusChange(key)}
            >
              {config.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver ce dossier</AlertDialogTitle>
            <AlertDialogDescription>
              \u00cates-vous s\u00fbr de vouloir archiver le dossier
              {clientName ? ` de ${clientName}` : ""} ? Le dossier restera
              accessible dans vos archives.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setArchiveOpen(false);
                performUpdate("archive");
              }}
            >
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
