"use client";

import { useState } from "react";
import type { TemplateQuestion } from "@legalconnect/shared";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionCard } from "./question-card";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuestionListProps {
  questions: TemplateQuestion[];
  onReorder: (questions: TemplateQuestion[]) => void;
  onUpdate: (index: number, question: TemplateQuestion) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}

// ---------------------------------------------------------------------------
// SortableQuestion — wraps QuestionCard with useSortable
// ---------------------------------------------------------------------------

interface SortableQuestionProps {
  question: TemplateQuestion;
  index: number;
  total: number;
  allQuestions: TemplateQuestion[];
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (question: TemplateQuestion) => void;
  onDelete: () => void;
}

function SortableQuestion({
  question,
  index,
  total,
  allQuestions,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <QuestionCard
        question={question}
        index={index}
        total={total}
        allQuestions={allQuestions}
        expanded={expanded}
        onToggle={onToggle}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners ?? {}}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestionList — DndContext + SortableContext
// ---------------------------------------------------------------------------

export function QuestionList({
  questions,
  onReorder,
  onUpdate,
  onDelete,
  onAdd,
}: QuestionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(questions, oldIndex, newIndex);
    onReorder(reordered);
  }

  return (
    <ScrollArea className="max-h-[600px]">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={questions.map((q) => q.id)}
          strategy={verticalListSortingStrategy}
        >
          <div role="list" className="space-y-2">
            {questions.map((q, i) => (
              <SortableQuestion
                key={q.id}
                question={q}
                index={i}
                total={questions.length}
                allQuestions={questions}
                expanded={expandedId === q.id}
                onToggle={() =>
                  setExpandedId((prev) => (prev === q.id ? null : q.id))
                }
                onUpdate={(updated) => onUpdate(i, updated)}
                onDelete={() => onDelete(i)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        variant="ghost"
        className="w-full mt-2"
        onClick={onAdd}
      >
        <Plus className="size-4 mr-1" />
        Ajouter une question
      </Button>
    </ScrollArea>
  );
}
