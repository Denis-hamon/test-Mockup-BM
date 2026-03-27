import * as React from "react";
import { sendEmail } from "./send";
import { VerificationEmail } from "./verification";
import { PasswordResetEmail } from "./password-reset";
import { WelcomeEmail } from "./welcome";
import { DeletionConfirmationEmail } from "./deletion-confirmation";
import { NewCaseNotification } from "./new-case-notification";
import { NewMessageNotification } from "./templates/new-message-notification";
import { AppointmentRequestNotification } from "./templates/appointment-request-notification";
import { AppointmentConfirmed } from "./templates/appointment-confirmed";
import { AppointmentRefused } from "./templates/appointment-refused";
import { AppointmentReminder } from "./templates/appointment-reminder";

export { VerificationEmail } from "./verification";
export { PasswordResetEmail } from "./password-reset";
export { WelcomeEmail } from "./welcome";
export { DeletionConfirmationEmail } from "./deletion-confirmation";
export { NewCaseNotification } from "./new-case-notification";
export { NewMessageNotification } from "./templates/new-message-notification";
export { AppointmentRequestNotification } from "./templates/appointment-request-notification";
export { AppointmentConfirmed } from "./templates/appointment-confirmed";
export { AppointmentRefused } from "./templates/appointment-refused";
export { AppointmentReminder } from "./templates/appointment-reminder";
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

export async function sendNewCaseNotification(
  to: string,
  data: {
    lawyerName?: string;
    clientName: string;
    problemType: string;
    submissionDate: string;
    caseUrl: string;
  },
) {
  return sendEmail({
    to,
    subject: `Nouveau dossier : ${data.clientName} - LegalConnect`,
    react: React.createElement(NewCaseNotification, data),
  });
}

// ---------------------------------------------------------------------------
// New message notification (D-05: NEVER include decrypted message content)
// ---------------------------------------------------------------------------

export async function sendNewMessageNotification(
  to: string,
  data: {
    recipientName: string;
    senderName: string;
    problemType: string;
    conversationId: string;
    baseUrl: string;
  },
) {
  return sendEmail({
    to,
    subject: "Nouveau message sur votre dossier - LegalConnect",
    react: React.createElement(NewMessageNotification, data),
  });
}

// ---------------------------------------------------------------------------
// Appointment request notification (to lawyer)
// ---------------------------------------------------------------------------

export async function sendAppointmentRequestNotification(
  to: string,
  data: {
    lawyerName: string;
    clientName: string;
    problemType: string;
    appointmentType: "visio" | "presentiel";
    preferredDates: string[];
    submissionId: string;
    baseUrl: string;
  },
) {
  return sendEmail({
    to,
    subject: "Nouvelle demande de rendez-vous - LegalConnect",
    react: React.createElement(AppointmentRequestNotification, data),
  });
}

// ---------------------------------------------------------------------------
// Appointment confirmed notification (to client)
// ---------------------------------------------------------------------------

export async function sendAppointmentConfirmedNotification(
  to: string,
  data: {
    clientName: string;
    lawyerName: string;
    confirmedDate: Date;
    type: "visio" | "presentiel";
    visioLink?: string;
    cabinetAddress?: string;
    baseUrl: string;
  },
) {
  return sendEmail({
    to,
    subject: "Rendez-vous confirme - LegalConnect",
    react: React.createElement(AppointmentConfirmed, data),
  });
}

// ---------------------------------------------------------------------------
// Appointment refused notification (to client)
// ---------------------------------------------------------------------------

export async function sendAppointmentRefusedNotification(
  to: string,
  data: {
    clientName: string;
    lawyerName: string;
    rejectionReason?: string;
    baseUrl: string;
  },
) {
  return sendEmail({
    to,
    subject: "Mise a jour de votre demande de rendez-vous - LegalConnect",
    react: React.createElement(AppointmentRefused, data),
  });
}

// ---------------------------------------------------------------------------
// Appointment reminder (J-1 / J-0)
// ---------------------------------------------------------------------------

export async function sendAppointmentReminder(
  to: string,
  data: {
    recipientName: string;
    lawyerName: string;
    confirmedDate: Date;
    type: "visio" | "presentiel";
    visioLink?: string;
    cabinetAddress?: string;
    isToday: boolean;
    baseUrl: string;
  },
) {
  const when = data.isToday ? "aujourd'hui" : "demain";
  return sendEmail({
    to,
    subject: `Rappel : rendez-vous ${when} - LegalConnect`,
    react: React.createElement(AppointmentReminder, data),
  });
}
