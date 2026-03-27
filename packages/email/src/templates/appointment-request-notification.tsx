import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface AppointmentRequestNotificationProps {
  lawyerName: string;
  clientName: string;
  problemType: string;
  appointmentType: "visio" | "presentiel";
  preferredDates: string[];
  submissionId: string;
  baseUrl: string;
}

export function AppointmentRequestNotification({
  lawyerName,
  clientName,
  problemType,
  appointmentType,
  preferredDates,
  submissionId,
  baseUrl,
}: AppointmentRequestNotificationProps) {
  const caseUrl = `${baseUrl}/dossiers/${submissionId}`;
  const typeLabel = appointmentType === "visio" ? "Visioconference" : "En cabinet";

  return (
    <Html>
      <Head />
      <Preview>Nouvelle demande de rendez-vous de {clientName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Nouvelle demande de rendez-vous</Heading>
          <Text style={text}>
            Bonjour Maitre {lawyerName},
          </Text>
          <Text style={text}>
            {clientName} a fait une demande de rendez-vous pour son dossier ({problemType}).
            Connectez-vous pour confirmer ou proposer un autre creneau.
          </Text>
          <Section style={detailsSection}>
            <Text style={detailText}>
              <strong>Type :</strong> {typeLabel}
            </Text>
            <Text style={detailText}>
              <strong>Dates preferees :</strong>
            </Text>
            {preferredDates.map((date, i) => (
              <Text key={i} style={detailText}>
                &bull; {new Date(date).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            ))}
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href={caseUrl}>
              Gerer le rendez-vous
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            LegalConnect — Votre espace juridique securise
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const heading = {
  color: "#1a1a2e",
  fontSize: "24px",
  fontWeight: "600" as const,
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const text = {
  color: "#4a4a68",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const detailsSection = {
  backgroundColor: "#f8f9fa",
  borderRadius: "6px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const detailText = {
  color: "#4a4a68",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 8px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const button = {
  backgroundColor: "#1a1a2e",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "600" as const,
  display: "inline-block",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  textAlign: "center" as const,
};
