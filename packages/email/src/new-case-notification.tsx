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

interface NewCaseNotificationProps {
  lawyerName?: string;
  clientName: string;
  problemType: string;
  submissionDate: string;
  caseUrl: string;
}

export function NewCaseNotification({
  lawyerName,
  clientName,
  problemType,
  submissionDate,
  caseUrl,
}: NewCaseNotificationProps) {
  return (
    <Html>
      <Head />
      <Preview>Nouveau dossier soumis par {clientName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Nouveau dossier recu</Heading>
          <Text style={text}>
            Bonjour {lawyerName || "Maitre"},
          </Text>
          <Text style={text}>
            Un nouveau dossier a ete soumis sur LegalConnect et attend votre
            attention.
          </Text>
          <Section style={detailsSection}>
            <Text style={detailText}>
              <strong>Client :</strong> {clientName}
            </Text>
            <Text style={detailText}>
              <strong>Type de probleme :</strong> {problemType}
            </Text>
            <Text style={detailText}>
              <strong>Date de soumission :</strong> {submissionDate}
            </Text>
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href={caseUrl}>
              Consulter le dossier
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
