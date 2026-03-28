"use client";

interface TimelineEvent {
  date: string;
  description: string;
}

interface ClientTimelineProps {
  events: TimelineEvent[];
  maxItems?: number;
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function ClientTimeline({ events, maxItems = 10 }: ClientTimelineProps) {
  const displayEvents = events.slice(0, maxItems);

  if (displayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm font-semibold">Aucun \u00e9v\u00e9nement</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Les \u00e9v\u00e9nements de votre dossier appara\u00eetront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {displayEvents.map((event, index) => {
        const isLast = index === displayEvents.length - 1;

        return (
          <div key={`${event.date}-${index}`} className="flex gap-4">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div className="h-3 w-3 flex-shrink-0 rounded-full bg-primary" />
              {!isLast && <div className="w-0.5 flex-1 bg-muted" />}
            </div>

            {/* Content */}
            <div className="flex flex-col gap-1 pb-6">
              <span className="text-sm">{event.description}</span>
              <span className="text-xs text-muted-foreground">
                {formatDate(event.date)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
