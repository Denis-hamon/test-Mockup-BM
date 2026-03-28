"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, MessageSquare, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSummaryProps {
  activeCases: number;
  unreadMessages: number;
  nextAppointment: { date: Date | null; type: string } | null;
  recentActivity: Array<{
    type: string;
    description: string;
    date: Date | null;
    caseId: string;
  }>;
}

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

export function DashboardSummary({
  activeCases,
  unreadMessages,
  nextAppointment,
  recentActivity,
}: DashboardSummaryProps) {
  const cards = [
    {
      title: "Dossiers actifs",
      value: String(activeCases),
      icon: FolderOpen,
      href: "/portail/dossiers",
    },
    {
      title: "Messages non lus",
      value: String(unreadMessages),
      icon: MessageSquare,
      href: "/portail/messages",
    },
    {
      title: "Prochain rendez-vous",
      value: nextAppointment?.date
        ? formatDate(nextAppointment.date)
        : "Aucun rendez-vous prévu",
      icon: CalendarDays,
      href: "/portail/rendez-vous",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {card.title}
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        card.title === "Prochain rendez-vous" &&
                          !nextAppointment?.date
                          ? "text-sm text-muted-foreground"
                          : "text-xl"
                      )}
                    >
                      {card.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-[20px] font-semibold leading-[1.2]">
            Activité récente
          </h2>
          <div className="flex flex-col gap-3">
            {recentActivity.slice(0, 5).map((event, index) => (
              <Link
                key={`${event.caseId}-${index}`}
                href={`/portail/dossiers/${event.caseId}`}
                className="flex items-center justify-between rounded-md border p-4 transition-colors hover:bg-muted/50"
              >
                <span className="text-sm">{event.description}</span>
                <span className="text-sm text-muted-foreground">
                  {formatRelativeTime(event.date)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
