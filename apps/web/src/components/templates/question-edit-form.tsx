"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { TemplateQuestion } from "@legalconnect/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { FieldTypeSelector } from "./field-type-selector";
import { ConditionalRule } from "./conditional-rule";

interface QuestionEditFormProps {
  question: TemplateQuestion;
  allQuestions: TemplateQuestion[];
  onUpdate: (question: TemplateQuestion) => void;
}

export function QuestionEditForm({
  question,
  allQuestions,
  onUpdate,
}: QuestionEditFormProps) {
  const [localLabel, setLocalLabel] = useState(question.label);
  const [localDescription, setLocalDescription] = useState(
    question.description ?? ""
  );
  const [showConditional, setShowConditional] = useState(
    !!question.conditionalRule
  );
  const [newOption, setNewOption] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Debounced text update
  const debouncedUpdate = useCallback(
    (field: string, value: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (field === "label") {
          onUpdate({ ...question, label: value });
        } else if (field === "description") {
          onUpdate({ ...question, description: value || undefined });
        }
      }, 300);
    },
    [question, onUpdate]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Sync local state if question changes externally (e.g., from reorder)
  useEffect(() => {
    setLocalLabel(question.label);
    setLocalDescription(question.description ?? "");
  }, [question.id, question.label, question.description]);

  return (
    <div className="space-y-4 pt-3 border-t">
      {/* Label */}
      <div className="space-y-1">
        <Label>Intitule de la question</Label>
        <Input
          value={localLabel}
          onChange={(e) => {
            setLocalLabel(e.target.value);
            debouncedUpdate("label", e.target.value);
          }}
          placeholder="Intitule de la question"
        />
      </div>

      {/* Description */}
      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea
          value={localDescription}
          onChange={(e) => {
            setLocalDescription(e.target.value);
            debouncedUpdate("description", e.target.value);
          }}
          placeholder="Description ou aide contextuelle (optionnel)"
          rows={2}
        />
      </div>

      {/* Field type */}
      <div className="space-y-1">
        <Label>Type de champ</Label>
        <FieldTypeSelector
          value={question.fieldType}
          onChange={(fieldType) => onUpdate({ ...question, fieldType })}
        />
      </div>

      {/* Options (only for select type) */}
      {question.fieldType === "select" && (
        <div className="space-y-2">
          <Label>Options</Label>
          {(question.options ?? []).map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={opt}
                onChange={(e) => {
                  const newOptions = [...(question.options ?? [])];
                  newOptions[i] = e.target.value;
                  onUpdate({ ...question, options: newOptions });
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  const newOptions = (question.options ?? []).filter(
                    (_, idx) => idx !== i
                  );
                  onUpdate({ ...question, options: newOptions });
                }}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Input
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              placeholder="Nouvelle option"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newOption.trim()) {
                  e.preventDefault();
                  onUpdate({
                    ...question,
                    options: [...(question.options ?? []), newOption.trim()],
                  });
                  setNewOption("");
                }
              }}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                if (newOption.trim()) {
                  onUpdate({
                    ...question,
                    options: [...(question.options ?? []), newOption.trim()],
                  });
                  setNewOption("");
                }
              }}
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Required toggle */}
      <div className="flex items-center justify-between">
        <Label>Obligatoire</Label>
        <Switch
          checked={question.required}
          onCheckedChange={(checked: boolean) =>
            onUpdate({ ...question, required: checked })
          }
        />
      </div>

      {/* Conditional toggle */}
      <div className="flex items-center justify-between">
        <Label>Conditionnel</Label>
        <Switch
          checked={showConditional}
          onCheckedChange={(checked: boolean) => {
            setShowConditional(checked);
            if (!checked) {
              onUpdate({ ...question, conditionalRule: undefined });
            }
          }}
        />
      </div>

      {/* Conditional rule editor */}
      {showConditional && (
        <ConditionalRule
          rule={question.conditionalRule ?? undefined}
          currentQuestionId={question.id}
          allQuestions={allQuestions}
          onChange={(rule) => onUpdate({ ...question, conditionalRule: rule })}
        />
      )}
    </div>
  );
}
