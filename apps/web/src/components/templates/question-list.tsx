"use client";

import type { TemplateQuestion } from "@legalconnect/shared";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Placeholder — full dnd-kit implementation in Task 2
interface QuestionListProps {
  questions: TemplateQuestion[];
  onReorder: (questions: TemplateQuestion[]) => void;
  onUpdate: (index: number, question: TemplateQuestion) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}

export function QuestionList({
  questions,
  onReorder,
  onUpdate,
  onDelete,
  onAdd,
}: QuestionListProps) {
  return (
    <div role="list" className="space-y-2">
      {questions.map((q, i) => (
        <div key={q.id} role="listitem" className="rounded border p-3 text-sm">
          {q.label}
        </div>
      ))}
      <Button
        variant="ghost"
        className="w-full"
        onClick={onAdd}
      >
        <Plus className="size-4 mr-1" />
        Ajouter une question
      </Button>
    </div>
  );
}
