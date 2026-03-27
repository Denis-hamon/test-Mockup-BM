"use client";

import type { LucideIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TemplateSpecialtyCardProps {
  specialty: string;
  label: string;
  questionCount: number;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
}

export function TemplateSpecialtyCard({
  specialty,
  label,
  questionCount,
  icon: Icon,
  selected,
  onSelect,
}: TemplateSpecialtyCardProps) {
  return (
    <Card
      role="radio"
      aria-checked={selected}
      aria-label={`Template ${label}`}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "relative cursor-pointer p-6 transition-shadow duration-150 hover:shadow-md",
        selected && "border-2 border-primary shadow-md",
        !selected && "shadow-sm"
      )}
    >
      {selected && (
        <CheckCircle2 className="absolute top-3 right-3 size-5 text-primary" />
      )}

      <div className="flex flex-col items-center gap-3 text-center">
        <Icon className="size-10 text-muted-foreground" />
        <h3 className="text-[20px] font-semibold">{label}</h3>
        <p className="text-sm text-muted-foreground">
          {questionCount} questions specifiques
        </p>
        <Button variant="ghost" size="sm" tabIndex={-1}>
          Utiliser ce template
        </Button>
      </div>
    </Card>
  );
}
