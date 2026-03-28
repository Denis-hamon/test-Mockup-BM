"use client";

import { cn } from "@/lib/utils";

interface CaseStatusTrackerProps {
  status: string;
}

const STEPS = [
  { label: "Nouveau", value: 1 },
  { label: "En cours", value: 2 },
  { label: "Termin\u00e9", value: 3 },
];

function statusToValue(status: string): number {
  if (status === "Nouveau") return 1;
  if (status === "En cours") return 2;
  if (status === "Termin\u00e9") return 3;
  return 1;
}

export function CaseStatusTracker({ status }: CaseStatusTrackerProps) {
  const currentValue = statusToValue(status);

  return (
    <div
      role="progressbar"
      aria-valuenow={currentValue}
      aria-valuemin={1}
      aria-valuemax={3}
      aria-valuetext={status}
      className="flex items-center gap-0"
    >
      {STEPS.map((step, index) => {
        const isCompleted = step.value <= currentValue;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {step.value}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isCompleted ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "mx-2 h-0.5 w-12",
                  step.value < currentValue ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
