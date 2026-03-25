"use client";

import { useState } from "react";
import { requestDataExport } from "@/server/actions/rgpd.actions";

export function ExportData() {
  const [loading, setLoading] = useState(false);
  const [exported, setExported] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const result = await requestDataExport();

      if ("error" in result && result.error) {
        return;
      }

      if ("data" in result && result.data) {
        // Trigger browser download of JSON file
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `legalconnect-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExported(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Vos donnees vous seront fournies au format JSON. L&apos;export ZIP avec
        fichiers joints sera disponible dans une prochaine version.
      </p>

      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Export en cours..." : "Exporter mes donnees"}
      </button>

      {exported && (
        <p className="text-sm text-muted-foreground">
          Export termine. Le fichier a ete telecharge.
        </p>
      )}
    </div>
  );
}
