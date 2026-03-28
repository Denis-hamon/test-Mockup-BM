import { RegisterForm } from "@/components/auth/register-form";

export const metadata = {
  title: "Créer un compte - LegalConnect",
  description: "Créez votre compte LegalConnect pour accéder à votre espace juridique sécurisé.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
