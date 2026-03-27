"use client";

import { useState, useEffect } from "react";
import type { TemplateQuestion } from "@legalconnect/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ConditionalRuleData {
  sourceQuestionId: string;
  operator: "equals" | "notEquals";
  expectedValue: string;
}

interface ConditionalRuleProps {
  rule: ConditionalRuleData | undefined;
  currentQuestionId: string;
  allQuestions: TemplateQuestion[];
  onChange: (rule: ConditionalRuleData | undefined) => void;
}

export function ConditionalRule({
  rule,
  currentQuestionId,
  allQuestions,
  onChange,
}: ConditionalRuleProps) {
  // Only show questions that appear BEFORE current question (prevent circular refs)
  const currentIndex = allQuestions.findIndex(
    (q) => q.id === currentQuestionId
  );
  const availableQuestions = allQuestions.filter(
    (_, i) => i < currentIndex
  );

  const sourceQuestion = rule?.sourceQuestionId
    ? allQuestions.find((q) => q.id === rule.sourceQuestionId)
    : undefined;

  const sourceIsSelect =
    sourceQuestion?.fieldType === "select" && sourceQuestion.options?.length;

  return (
    <div className="space-y-3 rounded-md border p-3 bg-muted/30">
      <Label className="text-xs font-medium text-muted-foreground">
        Afficher si
      </Label>

      {/* Source question select */}
      <Select
        value={rule?.sourceQuestionId ?? ""}
        onValueChange={(val) => {
          if (val !== null && val !== "") {
            onChange({
              sourceQuestionId: val as string,
              operator: rule?.operator ?? "equals",
              expectedValue: "",
            });
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choisir une question" />
        </SelectTrigger>
        <SelectContent>
          {availableQuestions.map((q) => (
            <SelectItem key={q.id} value={q.id}>
              {q.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator select */}
      {rule?.sourceQuestionId && (
        <Select
          value={rule.operator}
          onValueChange={(val) => {
            if (val !== null) {
              onChange({
                ...rule,
                operator: val as "equals" | "notEquals",
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">est egal a</SelectItem>
            <SelectItem value="notEquals">est different de</SelectItem>
          </SelectContent>
        </Select>
      )}

      {/* Expected value */}
      {rule?.sourceQuestionId && (
        <>
          {sourceIsSelect ? (
            <Select
              value={rule.expectedValue}
              onValueChange={(val) => {
                if (val !== null) {
                  onChange({ ...rule, expectedValue: val as string });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir une valeur" />
              </SelectTrigger>
              <SelectContent>
                {(sourceQuestion.options ?? []).map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Valeur attendue"
              value={rule.expectedValue}
              onChange={(e) =>
                onChange({ ...rule, expectedValue: e.target.value })
              }
            />
          )}
        </>
      )}
    </div>
  );
}
