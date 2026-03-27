"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import type { CaseIntelligenceResult } from "@/server/actions/case-intelligence.actions";

interface TabTimelineProps {
  timeline: CaseIntelligenceResult["timeline"];
}

export function TabTimeline({ timeline }: TabTimelineProps) {
  if (!timeline || (timeline.events.length === 0 && timeline.undatedEvents.length === 0)) {
    return (
      <Alert className="mt-4">
        <AlertTitle>Timeline non disponible</AlertTitle>
        <AlertDescription>
          La timeline n&apos;a pas encore ete generee pour ce dossier.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Dated events */}
      {timeline.events.length > 0 && (
        <div className="relative">
          {timeline.events.map((event, i) => (
            <div key={i} className="flex gap-4 pb-6 last:pb-0">
              {/* Timeline marker */}
              <div className="flex flex-col items-center">
                <div className="size-3 rounded-full bg-primary shrink-0 mt-1" />
                {i < timeline.events.length - 1 && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {event.date}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {event.source === "client" ? "Client" : "Document"}
                  </Badge>
                </div>
                <p className="text-sm mt-1">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Undated events */}
      {timeline.undatedEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Separator className="flex-1" />
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Evenements non dates
            </span>
            <Separator className="flex-1" />
          </div>

          <div className="space-y-3">
            {timeline.undatedEvents.map((event, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-2 rounded-full bg-muted-foreground/40 shrink-0 mt-2" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm">{event.description}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {event.source === "client" ? "Client" : "Document"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
