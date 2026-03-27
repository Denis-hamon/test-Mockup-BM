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

interface AppointmentConfirmedProps {
  clientName: string;
  lawyerName: string;
  confirmedDate: Date;
  type: "visio" | "presentiel";
  visioLink?: string;
  cabinetAddress?: string;
  baseUrl: string;
}

export function AppointmentConfirmed({
  clientName,
  lawyerName,
  confirmedDate,
  type,
  visioLink,
  cabinetAddress,
  baseUrl,
}: AppointmentConfirmedProps) {
  const rdvUrl = `${baseUrl}/portail/rendez-vous`;
  const dateStr = new Date(confirmedDate).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = new Date(confirmedDate).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const typeLabel = type === "visio" ? "Visioconference" : "En cabinet";

  return (
    <Html>
      <Head />
      <Preview>Votre rendez-vous avec {lawyerName} est confirme</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Rendez-vous confirme</Heading>
          <Text style={text}>
            Bonjour {clientName},
          </Text>
          <Text style={text}>
            Nous avons le plaisir de vous confirmer votre rendez-vous avec
            Maitre {lawyerName}.
          </Text>
          <Section style={detailsSection}>
            <Text style={detailText}>
              <strong>Date :</strong> {dateStr} a {timeStr}
            </Text>
            <Text style={detailText}>
              <strong>Type :</strong> {typeLabel}
            </Text>
            {type === "visio" && visioLink && (
              <Text style={detailText}>
                <strong>Lien visio :</strong>{" "}
                <a href={visioLink} style={{ color: "#1a1a2e" }}>
                  Rejoindre la visioconference
                </a>
              </Text>
            )}
            {type === "presentiel" && cabinetAddress && (
              <Text style={detailText}>
                <strong>Adresse :</strong> {cabinetAddress}
              </Text>
            )}
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href={rdvUrl}>
              Voir mes rendez-vous
            </Button>
          </Section>
          <Text style={text}>
            Si vous avez besoin de modifier ou annuler ce rendez-vous,
            n'hesitez pas a contacter votre avocat via la messagerie securisee.
          </Text>
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
