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

interface NewMessageNotificationProps {
  recipientName: string;
  senderName: string;
  problemType: string;
  conversationId: string;
  baseUrl: string;
}

export function NewMessageNotification({
  recipientName,
  senderName,
  problemType,
  conversationId,
  baseUrl,
}: NewMessageNotificationProps) {
  const messageUrl = `${baseUrl}/portail/messages?conversation=${conversationId}`;

  return (
    <Html>
      <Head />
      <Preview>Nouveau message sur votre dossier - LegalConnect</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Nouveau message</Heading>
          <Text style={text}>
            Bonjour {recipientName},
          </Text>
          <Text style={text}>
            Vous avez recu un nouveau message de {senderName} concernant votre
            dossier ({problemType}). Connectez-vous a votre espace securise pour
            le consulter.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={messageUrl}>
              Voir le message
            </Button>
          </Section>
          <Text style={noteText}>
            Pour des raisons de securite, le contenu de vos messages n'est
            jamais inclus dans les emails.
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

const noteText = {
  color: "#8898aa",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0 0 16px",
  fontStyle: "italic" as const,
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
