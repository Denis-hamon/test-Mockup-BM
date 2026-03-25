import { DeleteAccount } from "@/components/settings/delete-account";

export const metadata = {
  title: "Supprimer mon compte - LegalConnect",
};

export default function DeletePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Supprimer mon compte</h1>
      <DeleteAccount />
    </div>
  );
}
