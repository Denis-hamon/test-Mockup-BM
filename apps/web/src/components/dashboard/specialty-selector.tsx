"use client";

import { Checkbox } from "@/components/ui/checkbox";

const SPECIALTIES = [
  { value: "famille", label: "Droit de la famille" },
  { value: "travail", label: "Droit du travail" },
  { value: "penal", label: "Droit penal" },
  { value: "immobilier", label: "Droit immobilier" },
  { value: "commercial", label: "Droit commercial" },
  { value: "autre", label: "Autre" },
];

interface SpecialtySelectorProps {
  selected: string[];
  onChange: (specialties: string[]) => void;
}

export function SpecialtySelector({
  selected,
  onChange,
}: SpecialtySelectorProps) {
  function handleToggle(value: string, checked: boolean) {
    if (checked) {
      onChange([...selected, value]);
    } else {
      onChange(selected.filter((s) => s !== value));
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SPECIALTIES.map((specialty) => {
        const isChecked = selected.includes(specialty.value);
        return (
          <label
            key={specialty.value}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) =>
                handleToggle(specialty.value, !!checked)
              }
            />
            <span className="text-sm">{specialty.label}</span>
          </label>
        );
      })}
    </div>
  );
}
