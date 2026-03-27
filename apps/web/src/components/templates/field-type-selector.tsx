"use client";

import type { FieldType } from "@legalconnect/shared";
import {
  Type,
  AlignLeft,
  List,
  Calendar,
  CheckSquare,
  Hash,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldTypeSelectorProps {
  value: FieldType;
  onChange: (value: FieldType) => void;
}

const FIELD_TYPE_OPTIONS: Array<{
  value: FieldType;
  label: string;
  icon: React.ElementType;
}> = [
  { value: "text", label: "Texte court", icon: Type },
  { value: "textarea", label: "Paragraphe", icon: AlignLeft },
  { value: "select", label: "Selection", icon: List },
  { value: "date", label: "Date", icon: Calendar },
  { value: "checkbox", label: "Case a cocher", icon: CheckSquare },
  { value: "number", label: "Nombre", icon: Hash },
];

export function FieldTypeSelector({ value, onChange }: FieldTypeSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (val !== null) {
          onChange(val as FieldType);
        }
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Type de champ" />
      </SelectTrigger>
      <SelectContent>
        {FIELD_TYPE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                {opt.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
