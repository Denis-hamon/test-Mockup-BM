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
        Gérez vos préférences de consentement. Les données essentielles sont
        nécessaires au fonctionnement du service.
      </p>

      {/* Essential - always ON, disabled */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Données essentielles</p>
          <p className="text-sm text-muted-foreground">
            Nécessaires au fonctionnement du service (authentification, chiffrement, données de session).
          </p>
          {essentialConsent?.grantedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Dernière mise à jour : {new Date(essentialConsent.grantedAt).toLocaleDateString("fr-FR")}
            </p>
          )}
        </div>
        <button
          type="button"
          disabled
          className="relative h-6 w-11 cursor-not-allowed rounded-full bg-primary opacity-70"
          title="Le consentement essentiel ne peut pas être désactivé"
        >
          <span className="absolute left-[calc(100%-1.25rem-0.125rem)] top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
        </button>
      </div>

      {/* Analytics - toggleable */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="font-medium">Analytics et amélioration</p>
          <p className="text-sm text-muted-foreground">
            Données anonymisées pour améliorer le service (navigation, performance).
          </p>
          {analyticsConsent?.grantedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Dernière mise à jour : {new Date(analyticsConsent.grantedAt).toLocaleDateString("fr-FR")}
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
