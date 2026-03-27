import { Resend } from "resend";
import * as React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  return resend.emails.send({
    from: process.env.EMAIL_FROM || "LegalConnect <noreply@legalconnect.fr>",
    to,
    subject,
    ...(react ? { react } : {}),
    ...(text ? { text } : {}),
  });
}
