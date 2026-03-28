import { ExportData } from "@/components/settings/export-data";

export const metadata = {
  title: "Exporter mes donn\u00e9es - LegalConnect",
};

export default function ExportPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Exporter mes donn\u00e9es</h1>
      <ExportData />
    </div>
  );
}
