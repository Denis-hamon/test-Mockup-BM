import { ExportData } from "@/components/settings/export-data";

export const metadata = {
  title: "Exporter mes donnees - LegalConnect",
};

export default function ExportPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Exporter mes donnees</h1>
      <ExportData />
    </div>
  );
}
