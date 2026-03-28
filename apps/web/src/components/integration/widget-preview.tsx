// ---------------------------------------------------------------------------
// WidgetPreview — static mockup of the widget appearance (D-07)
// ---------------------------------------------------------------------------

interface WidgetPreviewProps {
  accentColor: string;
  firmName: string;
}

export function WidgetPreview({ accentColor, firmName }: WidgetPreviewProps) {
  return (
    <div className="relative min-h-[400px] overflow-hidden rounded-lg border bg-background">
      {/* Simulated website content */}
      <div className="p-6">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="mt-3 h-3 w-full rounded bg-muted" />
        <div className="mt-2 h-3 w-4/5 rounded bg-muted" />
        <div className="mt-2 h-3 w-3/5 rounded bg-muted" />
        <div className="mt-6 h-4 w-24 rounded bg-muted" />
        <div className="mt-3 h-3 w-full rounded bg-muted" />
        <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
      </div>

      {/* Floating button mockup */}
      <div
        className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full shadow-lg"
        style={{ backgroundColor: accentColor }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* Modal mockup (scaled down) */}
      <div className="absolute bottom-20 right-4 w-[220px] overflow-hidden rounded-lg border bg-background shadow-xl">
        {/* Header */}
        <div
          className="px-3 py-2 text-xs font-semibold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {firmName}
        </div>

        {/* Fake form fields */}
        <div className="flex flex-col gap-2 p-3">
          <div>
            <div className="mb-1 h-2 w-12 rounded bg-muted" />
            <div className="h-5 rounded border bg-background" />
          </div>
          <div>
            <div className="mb-1 h-2 w-16 rounded bg-muted" />
            <div className="h-5 rounded border bg-background" />
          </div>
          <div>
            <div className="mb-1 h-2 w-10 rounded bg-muted" />
            <div className="h-10 rounded border bg-background" />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t px-3 py-2 text-center text-[9px] text-muted-foreground">
          Propulse par LegalConnect
        </div>
      </div>
    </div>
  );
}
