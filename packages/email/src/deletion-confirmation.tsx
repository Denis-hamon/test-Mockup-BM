import * as React from "react";

interface DeletionConfirmationEmailProps {
  scheduledDate: string;
}

export function DeletionConfirmationEmail({
  scheduledDate,
}: DeletionConfirmationEmailProps) {
  return (
    <div
      style={{
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      <h1
        style={{
          fontSize: "24px",
          fontWeight: "600",
          color: "#1a1a2e",
          marginBottom: "24px",
        }}
      >
        Confirmation de suppression de compte
      </h1>

      <p style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        Bonjour,
      </p>

      <p style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        Votre demande de suppression de compte a ete prise en compte. Votre
        compte sera definitivement supprime le{" "}
        <strong>{scheduledDate}</strong>.
      </p>

      <p style={{ fontSize: "16px", color: "#374151", lineHeight: "1.6" }}>
        Si vous changez d&apos;avis, connectez-vous avant cette date pour
        annuler la suppression. Nous comprenons que cette decision peut etre
        difficile et restons a votre disposition.
      </p>

      <p
        style={{
          fontSize: "16px",
          color: "#374151",
          lineHeight: "1.6",
          marginTop: "32px",
        }}
      >
        Cordialement,
        <br />
        L&apos;equipe LegalConnect
      </p>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #e5e7eb",
          margin: "32px 0",
        }}
      />

      <p style={{ fontSize: "12px", color: "#9ca3af" }}>
        Cet email a ete envoye automatiquement par LegalConnect. Si vous
        n&apos;etes pas a l&apos;origine de cette demande, veuillez nous
        contacter immediatement.
      </p>
    </div>
  );
}
