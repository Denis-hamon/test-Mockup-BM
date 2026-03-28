"use client";

import zxcvbn from "zxcvbn";

const LABELS = ["Très faible", "Faible", "Moyen", "Fort", "Très fort"];
const COLORS = [
  "bg-red-500",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-green-500",
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const result = zxcvbn(password);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i <= result.score - 1 ? COLORS[result.score] : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{LABELS[result.score]}</p>
    </div>
  );
}
