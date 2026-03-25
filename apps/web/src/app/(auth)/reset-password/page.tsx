import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { ResetPasswordRequestForm } from "@/components/auth/reset-password-request-form";

export const metadata = {
  title: "Reinitialiser le mot de passe - LegalConnect",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (token) {
    return <ResetPasswordForm token={token} />;
  }

  return <ResetPasswordRequestForm />;
}
