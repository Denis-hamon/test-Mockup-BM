import { getConsents } from "@/server/actions/rgpd.actions";
import { ConsentManager } from "@/components/settings/consent-manager";

export const metadata = {
  title: "Confidentialite - LegalConnect",
};

export default async function PrivacyPage() {
  const consentsResult = await getConsents();

  const consents = Array.isArray(consentsResult) ? consentsResult : [];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Confidentialite</h1>
      <ConsentManager initialConsents={consents} />
    </div>
  );
}
