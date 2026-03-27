"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClientCase {
  id: string;
  problemType: string | null;
  status: string;
  createdAt: Date | null;
  lastMessageAt: Date | null;
  unreadCount: number;
}

interface CaseListClientProps {
  cases: ClientCase[];
}

const STATUS_STYLES: Record<string, string> = {
  Nouveau: "bg-primary/10 text-primary border-transparent",
  "En cours":
    "bg-[hsl(220_70%_50%/0.15)] text-[hsl(220_70%_40%)] border-transparent",
  Termine:
    "bg-[hsl(142_71%_45%/0.15)] text-[hsl(142_71%_30%)] border-transparent",
};

function formatDate(date: Date | null): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return "";
  const now = Date.now();
  const d = new Date(date).getTime();
  const diffMs = now - d;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "A l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return formatDate(date);
}

export function CaseListClient({ cases }: CaseListClientProps) {
  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <p className="text-sm font-semibold">
          Vous n&apos;avez pas encore de dossier
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre premier dossier apparaitra ici apres avoir soumis une demande
          via le formulaire d&apos;intake.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {cases.map((c) => (
        <Link key={c.id} href={`/portail/dossiers/${c.id}`}>
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-medium",
                    STATUS_STYLES[c.status] ?? ""
                  )}
                >
                  {c.status}
                </Badge>
                <span className="text-sm font-semibold">
                  {c.problemType ?? "Non defini"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Soumis le {formatDate(c.createdAt)}
                </span>
                <div className="flex items-center gap-2">
                  {c.lastMessageAt && (
                    <span className="text-sm text-muted-foreground">
                      Dernier message : {formatRelativeTime(c.lastMessageAt)}
                    </span>
                  )}
                  {c.unreadCount > 0 && (
                    <Badge
                      className="h-5 min-w-[20px] justify-center bg-[hsl(220_70%_50%)] px-1.5 text-xs text-white"
                      aria-label={`${c.unreadCount} messages non lus`}
                    >
                      {c.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
