import { Resend } from "resend";
import * as React from "react";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmail({
  to,
  subject,
  react,
  text,
}: {
  to: string;
  subject: string;
  react?: React.ReactElement;
  text?: string;
}) {
  if (!resend) {
    console.log(`[email] skip (no RESEND_API_KEY): to=${to} subject="${subject}"`);
    return { data: null, error: null };
  }
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "LegalConnect <noreply@legalconnect.fr>",
    to,
    subject,
    ...(react ? { react } : {}),
    ...(text ? { text } : {}),
  });
}
