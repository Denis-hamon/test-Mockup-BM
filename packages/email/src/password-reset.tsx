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

interface PasswordResetEmailProps {
  token: string;
  baseUrl?: string;
}

export function PasswordResetEmail({
  token,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.legalconnect.fr",
}: PasswordResetEmailProps) {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  return (
    <Html>
      <Head />
      <Preview>Reinitialisation de votre mot de passe - LegalConnect</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>
            Reinitialisation de votre mot de passe
          </Heading>
          <Text style={text}>
            Bonjour,
          </Text>
          <Text style={text}>
            Vous avez demande la reinitialisation de votre mot de passe
            LegalConnect. Cliquez sur le bouton ci-dessous pour definir un
            nouveau mot de passe.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={resetUrl}>
              Reinitialiser mon mot de passe
            </Button>
          </Section>
          <Text style={text}>
            Ce lien est valable pendant 1 heure. Passe ce delai, vous devrez
            effectuer une nouvelle demande de reinitialisation.
          </Text>
          <Text style={text}>
            Si vous n'avez pas demande cette reinitialisation, vous pouvez
            ignorer cet email en toute securite. Votre mot de passe actuel reste
            inchange.
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1a1a2e",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 32px",
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
