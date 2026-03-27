"use client";

import { useState } from "react";
import type { TemplateQuestion } from "@legalconnect/shared";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { QuestionEditForm } from "./question-edit-form";

interface QuestionCardProps {
  question: TemplateQuestion;
  index: number;
  total: number;
  allQuestions: TemplateQuestion[];
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (question: TemplateQuestion) => void;
  onDelete: () => void;
  dragHandleProps: Record<string, unknown>;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: "Texte court",
  textarea: "Paragraphe",
  select: "Selection",
  date: "Date",
  checkbox: "Case a cocher",
  number: "Nombre",
};

export function QuestionCard({
  question,
  index,
  total,
  allQuestions,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  dragHandleProps,
}: QuestionCardProps) {
  return (
    <div
      role="listitem"
      aria-label={`Question ${index + 1} sur ${total}: ${question.label}`}
      className="rounded-md border bg-background"
    >
      {/* Compact header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="size-4 text-muted-foreground" />
        </div>

        <span className="flex-1 truncate text-sm font-medium">
          {question.label}
        </span>

        <Badge variant="secondary" className="text-xs shrink-0">
          {FIELD_TYPE_LABELS[question.fieldType] ?? question.fieldType}
        </Badge>

        {question.required && (
          <span className="text-xs text-destructive font-medium shrink-0">*</span>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label="Modifier la question"
        >
          <Pencil className="size-3.5" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Supprimer la question"
              >
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette question ?</AlertDialogTitle>
              <AlertDialogDescription>
                Etes-vous sur de vouloir supprimer cette question ? Cette action
                est irreversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={onDelete}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Expanded: inline edit form */}
      {expanded && (
        <div className="px-3 pb-3">
          <QuestionEditForm
            question={question}
            allQuestions={allQuestions}
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
}
