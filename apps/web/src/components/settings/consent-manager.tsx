"use client";

import { useState } from "react";
import { updateConsent } from "@/server/actions/rgpd.actions";

interface ConsentItem {
  type: string;
  granted: boolean;
  grantedAt: Date | null;
  revokedAt: Date | null;
}

interface ConsentManagerProps {
  initialConsents: ConsentItem[];
}

export function ConsentManager({ initialConsents }: ConsentManagerProps) {
  const [consents, setConsents] = useState(initialConsents);
  const [loading, setLoading] = useState<string | null>(null);

  const essentialConsent = consents.find((c) => c.type === "essential");
  const analyticsConsent = consents.find((c) => c.type === "analytics");

  async function handleToggle(type: "essential" | "analytics", granted: boolean) {
    setLoading(type);
    try {
      const result = await updateConsent({ type, granted });
      if (Array.isArray(result)) {
        setConsents(result);
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Gerez vos preferences de consentement. Les donnees essentielles sont
        necessaires au fonctionnement du service.
      </p>

      {/* Essential - always ON, disabled */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Donnees essentielles</p>
          <p className="text-sm text-muted-foreground">
            Necessaires au fonctionnement du service (authentification, chiffrement, donnees de session).
          </p>
          {essentialConsent?.grantedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Derniere mise a jour : {new Date(essentialConsent.grantedAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled
          className="relative h-6 w-11 cursor-not-allowed rounded-full bg-primary opacity-70"
          title="Le consentement essentiel ne peut pas etre desactive"
        >
          <span className="absolute left-[calc(100%-1.25rem-0.125rem)] top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
        </button>
      </div>

      {/* Analytics - toggleable */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Analytics et amelioration</p>
          <p className="text-sm text-muted-foreground">
            Donnees anonymisees pour ameliorer le service (navigation, performance).
          </p>
          {analyticsConsent?.grantedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Derniere mise a jour : {new Date(analyticsConsent.grantedAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled={loading === "analytics"}
          onClick={() =>
            handleToggle("analytics", !analyticsConsent?.granted)
          }
          className={`relative h-6 w-11 rounded-full transition-colors ${
            analyticsConsent?.granted ? "bg-primary" : "bg-muted"
          } ${loading === "analytics" ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              analyticsConsent?.granted
                ? "left-[calc(100%-1.25rem-0.125rem)]"
                : "left-0.5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
