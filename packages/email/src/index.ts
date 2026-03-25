import * as React from "react";
import { sendEmail } from "./send";
import { VerificationEmail } from "./verification";
import { PasswordResetEmail } from "./password-reset";
import { WelcomeEmail } from "./welcome";
import { DeletionConfirmationEmail } from "./deletion-confirmation";

export { VerificationEmail } from "./verification";
export { PasswordResetEmail } from "./password-reset";
export { WelcomeEmail } from "./welcome";
export { DeletionConfirmationEmail } from "./deletion-confirmation";
export { sendEmail } from "./send";

export async function sendVerificationEmail(to: string, token: string) {
  return sendEmail({
    to,
    subject: "Confirmez votre adresse email - LegalConnect",
    react: React.createElement(VerificationEmail, { token }),
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  return sendEmail({
    to,
    subject: "Reinitialisation de votre mot de passe - LegalConnect",
    react: React.createElement(PasswordResetEmail, { token }),
  });
}

export async function sendWelcomeEmail(to: string, name?: string) {
  return sendEmail({
    to,
    subject: "Bienvenue sur LegalConnect",
    react: React.createElement(WelcomeEmail, { name }),
  });
}

export async function sendDeletionConfirmationEmail(
  to: string,
  scheduledDate: string,
) {
  return sendEmail({
    to,
    subject: "Confirmation de suppression de compte - LegalConnect",
    react: React.createElement(DeletionConfirmationEmail, { scheduledDate }),
  });
}
