"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  addLawyerNote,
  updateLawyerNote,
  deleteLawyerNote,
} from "@/server/actions/dashboard.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface InternalNotesProps {
  submissionId: string;
  notes: Array<{
    id: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export function InternalNotes({ submissionId, notes }: InternalNotesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);

  function handleAddNote() {
    if (!newNoteContent.trim()) return;
    startTransition(async () => {
      const result = await addLawyerNote(submissionId, newNoteContent.trim());
      if (result.success) {
        toast.success("Note enregistree");
        setNewNoteContent("");
        router.refresh();
      } else {
        toast.error("Erreur lors de l'enregistrement de la note");
      }
    });
  }

  function handleUpdateNote(noteId: string) {
    if (!editContent.trim()) return;
    startTransition(async () => {
      const result = await updateLawyerNote(noteId, editContent.trim());
      if (result.success) {
        toast.success("Note enregistree");
        setEditingNoteId(null);
        setEditContent("");
        router.refresh();
      } else {
        toast.error("Erreur lors de la mise a jour de la note");
      }
    });
  }

  function handleDeleteNote(noteId: string) {
    startTransition(async () => {
      const result = await deleteLawyerNote(noteId);
      if (result.success) {
        toast.success("Note supprimee");
        setDeleteNoteId(null);
        router.refresh();
      } else {
        toast.error("Erreur lors de la suppression de la note");
      }
    });
  }

  function startEditing(note: { id: string; content: string }) {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  }

  return (
    <div>
      <Separator className="mb-6" />
      <h2 className="text-lg font-semibold mb-4">Notes internes</h2>

      {/* Existing notes */}
      {notes.length > 0 && (
        <div className="space-y-3 mb-4">
          {notes.map((note) => (
            <Card key={note.id} size="sm">
              <CardContent>
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-20"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={isPending}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditContent("");
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(note.updatedAt || note.createdAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => startEditing(note)}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Modifier</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeleteNoteId(note.id)}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New note */}
      <div className="space-y-2">
        <Textarea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Ajoutez vos notes sur ce dossier... (visibles uniquement par vous)"
          className="min-h-20"
        />
        <Button
          size="sm"
          onClick={handleAddNote}
          disabled={isPending || !newNoteContent.trim()}
        >
          Enregistrer
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteNoteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteNoteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette note ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteNoteId) handleDeleteNote(deleteNoteId);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
